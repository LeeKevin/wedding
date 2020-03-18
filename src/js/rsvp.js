import React from 'react'
import { render } from 'react-dom'
import { fetch, get } from './_includes/fetch'

const apiURL = 'https://script.google.com/macros/s/AKfycbyj6iA6nUQEwM04FLJ7Ao3RRPMS_0DthX-wdY4aL7Vhv2jIAqo/exec'

const getDefaultInviteeResponse = (id, name, plusone) => ({
    date: new Date().toISOString(),
    id,
    originalName: name,
    name: plusone ? '' : name,
    willAttend: null,
    mealOption: null,
    plusone,
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
                !!response.willAttend &&
                <div className="select-input">
                    <select value={response.mealOption || ''} onChange={this.handleMealOption}>
                        <option value="">
                            Select Meal Option
                        </option>
                        <option value="Beef">
                            Braised Beef Short Rib
                        </option>
                        <option value="Duck">
                            Confit Duck Leg
                        </option>
                        <option value="Mushroom">
                            Wild Mushroom Ravioli (V)
                        </option>
                        <option value="Kids">
                            Kid's Option (TBD)
                        </option>
                    </select>
                </div>
            }
        </div>
    }
}

class RSVP extends React.Component {
    state = {
        code: '',
    }

    componentDidMount() {
        window.addEventListener('scroll', this.handleFloatingSubmit)
        window.addEventListener('resize', this.handleFloatingSubmit)
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

                const { name: nameList } = response
                const responses = {}
                const names = nameList.split(',').map(name => name.trim())
                response.responses.forEach(res => {
                    responses[res.originalName] = res
                })
                names.forEach(name => {
                    if (!responses[name]) {
                        responses[name] = getDefaultInviteeResponse(response.id, name)
                    }
                })

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

        fetch(`https://cors-anywhere.herokuapp.com/${apiURL}`, {
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
                Please enter your RSVP code provided on your invitation to unlock your RSVP form.
                If you're responding for you and a guest (or your family), you'll be able to RSVP for your entire group.
            </p>
            <div className="rsvp-code-form">
                <input id="rsvp-code"
                       type="text"
                       placeholder="RSVP Invitation Code"
                       value={code}
                       onChange={this.handleCodeInput}
                       onKeyPress={(e) => {
                           if (e.keyCode === 13 || e.which === 13) {
                               this.handleCode()
                           }
                       }}
                />
                <button id="rsvp-code-submit" disabled={!code} onClick={this.handleCode}>
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

        const extraResponses = Object
            .values(responses)
            .filter(response => !response.originalName || response.plusone)
        const expectedExtraResponses = invitee.reserved - names.length
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
            {
                Array(expectedExtraResponses)
                    .fill(null)
                    .map((_, i) => this.renderInvitee(
                        extraResponses[i] || getDefaultInviteeResponse(invitee.id, `extra-${i}`, true))
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
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                    Attending <a href="/schedule/#brunch" target="_blank">Sunday Brunch</a>?
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
                        Brunching
                    </a>
                    <a
                        className="button"
                        onClick={() => this.handleUpdateResponse({
                            ...details,
                            brunch: 0,
                        })}
                        data-selected={details.brunch === 0}
                    >
                        Not Brunching
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
                    <a
                        className="button"
                        onClick={this.submitRsvp}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
                    </a>

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
                        details until <strong>July 8, 2020</strong>.
                    </p>
                    : <div>
                        <p>
                            We're excited to celebrate with you! We truly hope you can join us. Please RSVP by&nbsp;
                            <strong style={{ display: 'inline-block' }}>July 8, 2020</strong>.
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
