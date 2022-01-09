import React from 'react'
import { render } from 'react-dom'
import sha512 from 'js-sha512'
import settings from '../../settings'

let match = ''

const isMatch = (password) => {
    const salted = sha512(password.toLowerCase().replace(/[^\w]/g, '') + settings.salt)
    return salted === match
}

const Login = () => {
    const [password, setPassword] = React.useState('')
    const [hasError, toggleError] = React.useState(false)

    const handleSubmit = (event) => {
        event.preventDefault()

        if (!isMatch(password)) {
            toggleError(true)
            return
        }

        localStorage.setItem('whatisit', password)
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''

        document.getElementById('password').style.display = 'none'
    }

    return <div className="password-inner-container">
        <div className="password-content">
            <div className="password-heading">
                Please type in the password
            </div>
            {!!hasError && <div className="password-error">
                The provided password was incorrect
            </div>}
            <form onSubmit={handleSubmit}>
                <input type="text" name="password" value={password} onChange={e => {
                    toggleError(false)
                    setPassword(e.target.value)
                }}/>
                <button type="submit">Submit</button>
            </form>
            <div className="password-subtitle">
                If you don’t know the password, <a href="mailto:hello@janelleandkevin.com">contact us</a> for it.
            </div>
        </div>
    </div>
}


function prepareLogin() {
    const passwordElement = document.getElementById('password')
    match = passwordElement.dataset.match

    delete passwordElement.dataset['match']

    const storedPassword = localStorage.getItem('whatisit')
    if (storedPassword && isMatch(storedPassword)) {
        passwordElement.parentElement.removeChild(passwordElement)
        return
    }

    window.scrollTo(0, 0)
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    render(
        <Login/>,
        passwordElement,
    )
}

module.export = prepareLogin

export default prepareLogin
