document.addEventListener('DOMContentLoaded', function() {
  // Инициализация элементов
  const paymentTypeSelect = document.getElementById('paymentType');
  const daysGroup = document.getElementById('daysGroup');
  const calculateBtn = document.getElementById('calculateBtn');
  const resultDiv = document.getElementById('result');
  const startTimeInput = document.getElementById('startTime');
  const endTimeInput = document.getElementById('endTime');

  // Автоматическая вставка двоеточия
  function formatTimeInput(input) {
    // Удаляем все нецифровые символы и двоеточия
    let value = input.value.replace(/[^\d]/g, '');
    
    // Добавляем двоеточие после первых двух цифр
    if (value.length > 2) {
      value = value.substring(0, 2) + ':' + value.substring(2, 4);
    }
    
    // Ограничиваем длину (5 символов максимум: 00:00)
    if (value.length > 5) {
      value = value.substring(0, 5);
    }
    
    input.value = value;
  }

  // Обработчики событий для полей времени
  startTimeInput.addEventListener('input', function() {
    formatTimeInput(this);
  });

  endTimeInput.addEventListener('input', function() {
    formatTimeInput(this);
  });

  // Данные тарифов
  const priceData = {
    будни: {
      '7:00 - 8:00': { разовое: 2200, абонемент: 1800, код: 1 },
      '8:00 - 18:00': { разовое: 2800, абонемент: 2500, код: 2 },
      '18:00 - 22:00': { разовое: 3200, абонемент: 2900, код: 3 },
      '22:00 - 23:00': { разовое: 2200, абонемент: 1800, код: 1 }
    },
    выходные: {
      '7:00 - 9:00': { разовое: 2500, абонемент: 2200, код: 4 },
      '9:00 - 21:00': { разовое: 3200, абонемент: 2900, код: 3 },
      '21:00 - 23:00': { разовое: 2500, абонемент: 2200, код: 4 }
    },
    группы: {
      '5+ человек': { разовое: 3200, абонемент: 2900, код: 3 }
    }
  };

  // Обработчик изменения типа оплаты
  paymentTypeSelect.addEventListener('change', function() {
    daysGroup.style.display = this.value === 'абонемент' ? 'block' : 'none';
  });

  // Обработчик нажатия кнопки расчета
  calculateBtn.addEventListener('click', calculatePrice);

  function timeToMinutes(time) {
    // Добавляем ":00" если введены только часы (например, "9" -> "9:00")
    if (time.indexOf(':') === -1 && time.length > 0) {
      time = time + ':00';
    }
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function getRateForTime(minutes, isWeekend, isGroup) {
    if (isGroup) return priceData.группы['5+ человек'];

    const rates = isWeekend ? priceData.выходные : priceData.будни;

    for (const [range, rate] of Object.entries(rates)) {
      const [start, end] = range.split(' - ').map(timeToMinutes);
      if (minutes >= start && minutes < end) return rate;
    }

    return null;
  }

  function calculateBookingCost(dayType, startTime, endTime, paymentType, isGroup = false, days = 1) {
    const isWeekend = dayType === 'выходные';
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    if (startMinutes >= endMinutes) {
      return 'Некорректный временной интервал';
    }

    let totalCost = 0;
    let currentMinute = startMinutes;

    while (currentMinute < endMinutes) {
      const rate = getRateForTime(currentMinute, isWeekend, isGroup);
      if (!rate) return 'Часть бронирования вне рабочего времени';

      const currentRates = isWeekend ? priceData.выходные : priceData.будни;
      let periodEnd = endMinutes;
      
      for (const [range] of Object.entries(currentRates)) {
        const [start, end] = range.split(' - ').map(timeToMinutes);
        if (currentMinute >= start && currentMinute < end) {
          periodEnd = Math.min(end, endMinutes);
          break;
        }
      }

      const durationHours = (periodEnd - currentMinute) / 60;
      totalCost += durationHours * rate[paymentType];
      currentMinute = periodEnd;
    }

    if (paymentType === 'абонемент') {
      totalCost *= days;
    }

    return Math.round(totalCost);
  }

  function calculatePrice() {
    // Нормализация времени (добавляем ":00" если нужно)
    const normalizeTime = (time) => {
      if (!time.includes(':') && time.length > 0) {
        return time + ':00';
      }
      return time;
    };

    const dayType = document.getElementById('dayType').value;
    const startTime = normalizeTime(startTimeInput.value);
    const endTime = normalizeTime(endTimeInput.value);
    const paymentType = document.getElementById('paymentType').value;
    const isGroup = document.getElementById('isGroup').value === 'true';
    const days = paymentType === 'абонемент' ? parseInt(document.getElementById('days').value) : 1;

    // Валидация времени
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      showResult('Ошибка: неверный формат времени начала (используйте ЧЧ:ММ)', true);
      return;
    }

    if (!timeRegex.test(endTime)) {
      showResult('Ошибка: неверный формат времени окончания (используйте ЧЧ:ММ)', true);
      return;
    }

    const cost = calculateBookingCost(dayType, startTime, endTime, paymentType, isGroup, days);

    if (typeof cost === 'string') {
      showResult(cost, true);
    } else {
      let message = `Стоимость бронирования: ${cost} рублей`;
      if (paymentType === 'абонемент' && days > 1) {
        message += ` (за ${days} дней)`;
      }
      showResult(message, false);
    }
  }

  function showResult(message, isError) {
    resultDiv.textContent = message;
    resultDiv.className = isError ? 'result error' : 'result success';
    resultDiv.style.display = 'block';
  }
});