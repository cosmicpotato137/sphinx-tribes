import React, { useEffect, useState, useRef } from "react";
import { useStores } from "../../store";
import { useObserver } from "mobx-react-lite";
import Form from "../../form";
import ConfirmMe from "../confirmMe";
import type { MeInfo, MeData } from '../../store/ui'
import { emptyMeInfo } from '../../store/ui'
import { meSchema } from '../../form/schema'
import api from '../../api'
import styled, { css } from "styled-components";
import { getHostIncludingDockerHosts } from "../../host";
import { Button } from "../../sphinxUI";
import moment from 'moment'

// this is where we see others posts (etc) and edit our own
export default function FocusedView(props: any) {
    const { onSuccess, goBack, config, selectedIndex, editMode, person } = props
    const { ui, main } = useStores();

    const [loading, setLoading] = useState(false);
    const scrollDiv: any = useRef(null)
    const formRef: any = useRef(null)

    function closeModal(override) {
        ui.setEditMe(false);
        if (props.goBack) props.goBack()
    }

    // in case you arent logged in
    async function testChallenge(chal: string) {
        try {
            const me: MeInfo = await api.get(`poll/${chal}`);
            if (me && me.pubkey) {
                ui.setMeInfo(me);
                ui.setEditMe(true);
            }
        } catch (e) {
            console.log(e);
        }
    }

    useEffect(() => {
        try {
            var urlObject = new URL(window.location.href);
            var params = urlObject.searchParams;
            const chal = params.get("challenge");
            if (chal) {
                testChallenge(chal);
            }
        } catch (e) { }
    }, []);

    function mergeFormWithMeData(v) {
        let fullMeData: any = null


        if (ui.meInfo) {
            fullMeData = { ...ui.meInfo }

            // if about
            if (config.name === 'about') {
                config.schema.forEach((s => {
                    fullMeData[s.name] = v[s.name]
                }))
            }
            // if extras
            else {
                // add timestamp if not there
                if (!v.created) v.created = moment().unix()
                // if editing widget
                if (selectedIndex > -1) {
                    // mutate it?
                    fullMeData.extras[config.name][selectedIndex] = v
                } else {
                    // if creating new widget
                    if (fullMeData.extras[config.name]) {
                        //if not first of its kind
                        fullMeData.extras[config.name].unshift(v)
                    }
                    else {
                        //if first of its kind
                        fullMeData.extras[config.name] = [v]
                    }
                }
            }
        }
        return fullMeData
    }

    async function submitForm(body) {
        console.log('SUBMIT FORM', body);
        body = mergeFormWithMeData(body)
        // console.log('mergeFormWithMeData', body);
        if (!body) return // avoid saving bad state

        const info = ui.meInfo as any;
        if (!info) return console.log("no meInfo");
        setLoading(true);
        try {
            const URL = info.url.startsWith("http") ? info.url : `https://${info.url}`;
            const r = await fetch(URL + "/profile", {
                method: "POST",
                body: JSON.stringify({
                    // use docker host (tribes.sphinx), because relay will post to it
                    host: getHostIncludingDockerHosts(),
                    ...body,
                    price_to_meet: parseInt(body.price_to_meet),
                }),
                headers: {
                    "x-jwt": info.jwt,
                    "Content-Type": "application/json",
                },
            });
            if (!r.ok) {
                setLoading(false);
                return alert("Failed to create profile");
            }

            await main.getPeople('')
            closeModal(true)
        } catch (e) {
            console.log('e', e)
        }
        setLoading(false);

    }

    return useObserver(() => {
        // let initialValues: MeData = emptyMeInfo;
        let initialValues: any = {};

        let personInfo = editMode ? ui.meInfo : person

        // set initials here
        if (personInfo) {
            if (config && config.name === 'about') {
                initialValues.id = personInfo.id || 0
                initialValues.pubkey = personInfo.pubkey
                initialValues.owner_alias = personInfo.alias || ""
                initialValues.photo_url = personInfo.photo_url || ""
                initialValues.price_to_meet = personInfo.price_to_meet || 0
                initialValues.description = personInfo.description || ""
            } else {
                // if there is a selected index, fill in values
                if (selectedIndex > -1) {
                    const extras = { ...personInfo.extras }
                    let sel = extras[config.name][selectedIndex]
                    config.schema.forEach(s => {
                        initialValues[s.name] = sel[s.name]
                    })
                }
            }
        }

        return (
            <div style={{ ...props.style, width: '100%', height: '100%' }}>
                {/* {renderWarnBeforeClose()} */}

                <B ref={scrollDiv} hide={false}>
                    {!ui.meInfo && <ConfirmMe />}
                    {ui.meInfo && (
                        <Form
                            readOnly={!editMode}
                            formRef={formRef}
                            submitText={config && config.submitText}
                            loading={loading}
                            close={goBack}
                            onSubmit={submitForm}
                            scrollDiv={scrollDiv}
                            schema={config && config.schema}
                            initialValues={initialValues}
                            extraHTML={
                                ui.meInfo.verification_signature
                                    ? {
                                        twitter: `<span>Post this to your twitter account to verify:</span><br/><strong>Sphinx Verification: ${ui.meInfo.verification_signature}</strong>`,
                                    }
                                    : {}
                            }
                        />
                    )}
                </B>
            </div>
        );

    });
}


const EnvWithScrollBar = ({ thumbColor, trackBackgroundColor }) => css`
                scrollbar-color: ${thumbColor} ${trackBackgroundColor}; // Firefox support
                scrollbar-width: thin;

                &::-webkit-scrollbar {
                    width: 6px;
                height: 100%;
  }

                &::-webkit-scrollbar-thumb {
                    background - color: ${thumbColor};
                background-clip: content-box;
                border-radius: 5px;
                border: 1px solid ${trackBackgroundColor};
  }

                &::-webkit-scrollbar-corner,
                &::-webkit-scrollbar-track {
                    background - color: ${trackBackgroundColor};
  }
}

                `
interface BProps {
    hide: boolean;
}
const B = styled.div<BProps>`
                    display: ${p => p.hide && 'none'};
                    height:100%;
                    width: 100%;
                    overflow-y:auto;
                    box-sizing:border-box;
                    ${EnvWithScrollBar({
    thumbColor: '#5a606c',
    trackBackgroundColor: 'rgba(0,0,0,0)',
})}
                    `