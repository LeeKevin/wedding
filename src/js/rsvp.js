import React from 'react'
import { render } from 'react-dom'
import { fetch, get } from './_includes/fetch'
import { DateTime } from 'luxon'
import settings from '../settings'

const apiURL = 'https://script.google.com/macros/s/AKfycbxQfiEvB1JMGjkP2He2dxtObyySJz7RHGcN4df0s1Lz5J_McfZytC9r_jnJGRGtpR0l/exec'

const weddingDate = DateTime.fromISO(settings.date)

const getDefaultInviteeResponse = (id, name, isKid = false) => ({
    date: new Date().toISOString(),
    id,
    originalName: name,
    name,
    willAttend: null,
    mealOption: null,
    isKid,
})

class InviteResponse extends React.PureComponent {
    state = {}

    handleAttend = (willAttend) => {
        const { response, handleUpdate } = this.props

        handleUpdate({
            ...response,
            willAttend,
        })
    }

    handleMealOption = (e) => {
        const { response, handleUpdate } = this.props

        const mealOption = e.target.value
        handleUpdate({
            ...response,
            mealOption,
        })
    }

    toggleEdit = () => {
        this.setState(prevState => ({
            edit: !prevState.edit,
        }), () => {
            const { edit } = this.state

            if (edit && this.nameInput) {
                this.nameInput.focus()
            }
        })
    }

    handleName = () => {
        const { response, handleUpdate } = this.props

        const name = this.nameInput.value || ''
        handleUpdate({
            ...response,
            name,
        })

        this.toggleEdit()
    }

    renderMealDescription = (option) => {
        switch (option) {
            case 'Beef':
                return <div className="meal-description">
                    <div className="meal-title">Red wine braised short rib</div>
                    <div className="meal-subtitle">
                        Onion Soubise, Grilled Leek, Potato Pavé
                    </div>
                </div>
            case 'Salmon':
                return <div className="meal-description">
                    <div className="meal-title">
                        Pacific King Salmon
                    </div>
                    <div className="meal-subtitle">
                        Bearnaise Mousse, Potato Confit, Spring Beans, Tarragon Glass
                    </div>
                </div>
            case 'Panisse':
                return <div className="meal-description">
                    <div className="meal-title">
                        Crispy panisse
                    </div>
                    <div className="meal-subtitle">
                        Summer Romesco, Charred Vegetables, Pea Shoots, Herb Oil
                    </div>
                </div>
            default:
                return null
        }
    }

    render() {
        const { response } = this.props
        const { edit } = this.state

        const name = !response.name
            ? 'Additional Guest'
            : response.name

        return <div className="invitee">
            <div className="invitee__name">
                {
                    !edit
                        ? <div>
                            {name}&nbsp;
                            <a
                                className="edit-toggle fa fa-pencil"
                                onClick={this.toggleEdit}
                            />
                        </div>
                        : <div>
                            <input ref={el => this.nameInput = el} type="text" defaultValue={response.name || ''}/>
                            <div className="edit-name-buttons" style={{ textAlign: 'right' }}>
                                <a style={{ fontWeight: 'normal' }} onClick={this.toggleEdit}>Cancel</a>
                                <a onClick={this.handleName}>Update</a>
                            </div>
                        </div>
                }
            </div>
            <div>
                <a
                    className="button"
                    onClick={() => this.handleAttend(1)}
                    data-selected={response.willAttend === 1}
                >
                    Will Attend
                </a>
                <a
                    className="button"
                    onClick={() => this.handleAttend(0)}
                    data-selected={response.willAttend === 0}
                >
                    Will Not Attend
                </a>
            </div>
            {
                !!response.willAttend && <>
                    <div className="select-input">
                        <select value={response.mealOption || ''} onChange={this.handleMealOption}>
                            <option value="">
                                Select Meal Option
                            </option>
                            {
                                response.isKid ? <>
                                        <option value="Kids">
                                            Kid's Option (TBD)
                                        </option>
                                        <option value="No meal">
                                            No meal needed
                                        </option>
                                    </> :
                                    <>
                                        <option value="Beef">
                                            Braised Beef Short Rib
                                        </option>
                                        <option value="Salmon">
                                            Salmon Bearnaise
                                        </option>
                                        <option value="Panisse">
                                            Crispy Panisse (V)
                                        </option>
                                    </>
                            }
                        </select>
                    </div>
                    {
                        response.mealOption ? this.renderMealDescription(response.mealOption) : null
                    }
                </>

            }
        </div>
    }
}

class RSVP extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            code: localStorage.getItem('rsvp') || '',
        }
    }

    componentDidMount() {
        window.addEventListener('scroll', this.handleFloatingSubmit)
        window.addEventListener('resize', this.handleFloatingSubmit)

        if (this.state.code) {
            this.handleCode()
        }
    }

    handleFloatingSubmit = () => {
        const { hasFloatingSubmit } = this.state
        if (this.submitContainer) {
            const threshold = window.pageYOffset + this.submitContainer.getBoundingClientRect().top +
                this.submitContainer.clientHeight

            const windowHeight = window.innerHeight
                || document.documentElement.clientHeight
                || document.body.clientHeight
            const scrollBottom = Math.max(document.body.scrollTop || 0, document.documentElement.scrollTop || 0) +
                windowHeight

            if (scrollBottom < threshold) {
                if (!hasFloatingSubmit) {
                    this.setState({
                        hasFloatingSubmit: true
                    })
                }
            } else if (hasFloatingSubmit) {
                this.setState({
                    hasFloatingSubmit: false,
                })
            }
        }
    }

    handleCodeInput = (e) => {
        this.setState({
            code: e.target.value,
        })
    }

    handleCode = () => {
        const { code, isProcessingCode } = this.state

        if (isProcessingCode) return

        this.setState({
            error: null,
            isProcessingCode: true,
        })

        get(apiURL, { code })
            .then((response) => {
                if (response.error) {
                    this.setState({
                        error: response.error,
                        isProcessingCode: false,
                    })
                    return
                }

                const { names: nameList, kids: kidList } = response
                const responses = {}
                const names = nameList.map(name => name.trim())
                const kids = new Set(kidList.map(kid => kid.trim()))
                response.responses.forEach(res => {
                    responses[res.originalName] = res
                })
                names.forEach(name => {
                    if (!responses[name]) {
                        responses[name] = getDefaultInviteeResponse(response.id, name, kids.has(name))
                    }
                })

                localStorage.setItem('rsvp', code)

                this.setState({
                    isProcessingCode: false,
                    invitee: response,
                    names,
                    responses,
                })
            }, () => {
                this.setState({
                    error: 'There was an error with the server.',
                    isProcessingCode: false,
                })
            })
    }

    handleUpdateResponse = (response) => {
        this.setState(prevState => ({
            responses: {
                ...prevState.responses,
                [response.originalName]: response,
            },
        }))
    }

    submitRsvp = () => {
        const { invitee, responses, isSubmitting } = this.state

        if (isSubmitting) return

        const responseList = Object.values(responses)

        // Validate
        let error = null
        if (responseList.length !== invitee.reserved) {
            error = 'Ensure each guest has their attendance marked.'
        } else if (responseList.some(res => res.willAttend == null)) {
            error = 'Ensure each guest has their attendance marked.'
        } else if (responseList.some(res => res.willAttend === 1 && (!res.name.trim() || !res.mealOption))) {
            error = 'Ensure each attending guest has a name filled in and meal option selected.'
        }

        this.setState({
            error,
        })

        if (error) return

        this.setState({
            isSubmitting: true,
        })

        fetch(`https://cryptic-inlet-64432.herokuapp.com/${apiURL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(responseList),
        })
            .then(response => response.text())
            .then((response) => {
                response = JSON.parse(response)
                if (response.error) {
                    this.setState({
                        error: response.error,
                        isSubmitting: false,
                    })
                    return
                }

                this.setState({
                    isSubmitting: false,
                    isComplete: true,
                })
            }, () => {
                this.setState({
                    error: 'There was an error with the server.',
                    isSubmitting: false,
                })
            })
    }

    renderForm = () => {
        const {
            code,
            isProcessingCode,
        } = this.state

        return <div>
            <p>
                Please enter your name. If you're responding for you and a guest (or your family), you'll be able to
                RSVP for your entire group.
            </p>
            <div className="rsvp-code-form">
                <input
                    id="rsvp-code"
                    type="text"
                    placeholder="Name"
                    value={code}
                    onChange={this.handleCodeInput}
                    onKeyPress={(e) => {
                        if (e.keyCode === 13 || e.which === 13) {
                            this.handleCode()
                        }
                    }}
                    disabled={isProcessingCode}
                />
                <button id="rsvp-code-submit" disabled={!code || isProcessingCode} onClick={this.handleCode}>
                    {isProcessingCode ? 'Processing...' : 'Continue'}
                </button>
            </div>
        </div>
    }

    renderInvitee = (response) => <InviteResponse
        key={response.originalName}
        response={response}
        handleUpdate={this.handleUpdateResponse}
    />

    renderInvitees = () => {
        const {
            invitee,
            names,
            responses,
            hasFloatingSubmit,
            error,
            isSubmitting,
        } = this.state

        const details = responses[names[0]] || {}

        return <div className="invitee-list">
            <p>
                We have reserved <strong>{invitee.reserved} {invitee.reserved == 1 ? 'seat' : 'seats'}</strong> for your
                party.
            </p>
            {
                names
                    .map(name => this.renderInvitee(
                        responses[name] || getDefaultInviteeResponse(invitee.id, name))
                    )
            }
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Dietary Restrictions?</div>
                <textarea
                    defaultValue={details.dietaryRestrictions}
                    onBlur={(e) => {
                        this.handleUpdateResponse({
                            ...details,
                            dietaryRestrictions: e.target.value,
                        })
                    }}
                />
            </div>
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Song Requests?</div>
                <textarea
                    defaultValue={details.songRequests}
                    onBlur={(e) => {
                        this.handleUpdateResponse({
                            ...details,
                            songRequests: e.target.value,
                        })
                    }}
                />
            </div>
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 12 }}>
                    Attending <a href="{{root}}/schedule/#breakfast" target="_blank">Monday Breakfast</a>?
                </div>
                <div>
                    <a
                        className="button"
                        onClick={() => this.handleUpdateResponse({
                            ...details,
                            brunch: 1,
                        })}
                        data-selected={details.brunch === 1}
                    >
                        Breaking (attending)
                    </a>
                    <a
                        className="button"
                        onClick={() => this.handleUpdateResponse({
                            ...details,
                            brunch: 0,
                        })}
                        data-selected={details.brunch === 0}
                    >
                        Fasting <br/>(not attending)
                    </a>
                </div>
            </div>
            <div ref={el => this.submitContainer = el} className="submit-rsvp" style={{ height: 40 }}>
                <div
                    className={hasFloatingSubmit ? 'submit-rsvp__float' : null}
                    style={{
                        position: hasFloatingSubmit ? 'fixed' : 'relative',
                        bottom: hasFloatingSubmit ? 0 : null,
                        left: hasFloatingSubmit ? 0 : null,
                    }}
                >
                    {
                        weddingDate.minus({ months: 1, weeks: 2 }).diffNow('days') < 0 ?
                            <i>RSVP changes unavailable</i>
                            : <a
                                className="button"
                                onClick={this.submitRsvp}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
                            </a>
                    }
                    {
                        error && hasFloatingSubmit && <div className="error">{error}</div>
                    }
                </div>
            </div>
        </div>
    }

    render() {
        const {
            error,
            invitee,
            isComplete,
        } = this.state

        return <div>
            {
                isComplete
                    ? <p>
                        Thank you for your RSVP. You can revisit this page to check or update your RSVP
                        details until <strong>{weddingDate.minus({ months: 1, weeks: 2 })
                                                          .toLocaleString(DateTime.DATE_FULL)}</strong>.
                    </p>
                    : <div>
                        <p>
                            We're excited to celebrate with you! We truly hope you can join us. Please RSVP by&nbsp;
                            <strong style={{ display: 'inline-block' }}>{weddingDate.minus({ months: 1, weeks: 3 })
                                                                                    .toLocaleString(DateTime.DATE_FULL)}</strong>.
                        </p>
                        {
                            invitee
                                ? this.renderInvitees()
                                : this.renderForm()
                        }
                    </div>
            }

            {error && <div className="error">{error}</div>}

            <p style={{ marginTop: 16 }}>
                Having trouble? <a href="mailto:hello@janelleandkevin.com">Contact us</a> and we'll figure it out.
            </p>
        </div>
    }
}

window.addEventListener('load', function () {
    render(
        <RSVP/>,
        document.getElementById('rsvp-form'),
    )
})
