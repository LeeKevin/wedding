import './_includes/addevent'
const Details = require('./_includes/accordion')

window.addEventListener('load', function () {
    // Initialize accordions
    const els = document.getElementsByClassName('accordion')
    const accordionElements = []
    for (let i = 0; i < els.length; i++) {
        const details = new Details(els[i], {
            speed: 500,
            one_visible: true
        })
        details.init()
        accordionElements.push(details)
    }
    window.addEventListener('resize', () => {
        accordionElements.forEach(details => {
            details.resize()
        })
    })
})
