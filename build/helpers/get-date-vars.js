const DateTime = require('luxon').DateTime

const getDateVars = (date) => {
    const weddingDate = DateTime.fromISO(date)
    return {
        'fullDateWithDayOfWeek': weddingDate.toLocaleString(DateTime.DATE_HUGE),
        'fullDate': weddingDate.toLocaleString(DateTime.DATE_FULL),
        'shortDate': weddingDate.toLocaleString(DateTime.DATE_SHORT),
        'styledShortDate': weddingDate.toFormat('LL.dd.yyyy'),
        'dayOfWeek': weddingDate.weekdayLong,
        'dayOfMonth': weddingDate.day,
        'month': weddingDate.monthLong,
        'year': weddingDate.year,
    }
}

module.exports = getDateVars
