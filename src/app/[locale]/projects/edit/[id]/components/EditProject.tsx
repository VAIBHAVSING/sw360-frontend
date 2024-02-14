// Copyright (C) Siemens AG, 2023. Part of the SW360 Frontend Project.

// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/

// SPDX-License-Identifier: EPL-2.0
// License-Filename: LICENSE

'use client'

import Administration from '@/components/ProjectAddSummary/Administration'
import LinkedReleasesAndProjects from '@/components/ProjectAddSummary/LinkedReleasesAndProjects'
import Summary from '@/components/ProjectAddSummary/Summary'
import { HttpStatus, InputKeyValue, Project, ToastData, Vendor, ProjectSummaryPayload } from '@/object-types'
import { ApiUtils, CommonUtils } from '@/utils'
import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { ToastMessage } from 'next-sw360'
import { notFound, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Button, Col, ListGroup, Row, Tab, ToastContainer } from 'react-bootstrap'

function EditProject({ projectId }: { projectId: string }) {
    const router = useRouter()
    const t = useTranslations('default')
    const { data: session, status } = useSession()
    const [vendor, setVendor] = useState<Vendor>({
        id: '',
        fullName: '',
    })

    const [externalUrls, setExternalUrls] = useState<InputKeyValue[]>([])

    const [externalIds, setExternalIds] = useState<InputKeyValue[]>([
        {
            key: '',
            value: '',
        },
    ])

    const [additionalData, setAdditionalData] = useState<InputKeyValue[]>([
        {
            key: '',
            value: '',
        },
    ])

    const [projectPayload, setProjectPayload] = useState<ProjectSummaryPayload>({
        name: '',
        version: '',
        visibility: 'EVERYONE',
        createdBy: '',
        projectType: 'PRODUCT',
        tag: '',
        description: '',
        domain: '',
        defaultVendorId: '',
        modifiedOn: '',
        modifiedBy: '',
        externalUrls: null,
        additionalData: {},
        externalIds: null,
    })

    const [toastData, setToastData] = useState<ToastData>({
        show: false,
        type: '',
        message: '',
        contextual: '',
    })

    const alert = (show_data: boolean, status_type: string, message: string, contextual: string) => {
        setToastData({
            show: show_data,
            type: status_type,
            message: message,
            contextual: contextual,
        })
    }

    const setDataExternalUrls = (externalUrls: Map<string, string>) => {
        const obj = Object.fromEntries(externalUrls)
        setProjectPayload({
            ...projectPayload,
            externalUrls: obj,
        })
    }

    const setDataExternalIds = (externalIds: Map<string, string>) => {
        const obj = Object.fromEntries(externalIds)
        setProjectPayload({
            ...projectPayload,
            externalIds: obj,
        })
    }

    const setDataAdditionalData = (additionalData: Map<string, string>) => {
        const obj = Object.fromEntries(additionalData)
        setProjectPayload({
            ...projectPayload,
            additionalData: obj,
        })
    }

    const fetchData = useCallback(
        async (url: string) => {
            const response = await ApiUtils.GET(url, session.user.access_token)
            if (response.status == HttpStatus.OK) {
                const data = (await response.json()) as Project
                return data
            } else if (response.status == HttpStatus.UNAUTHORIZED) {
                return signOut()
            } else {
                notFound()
            }
        },[]
    )

    useEffect(() => {
        void fetchData(`projects/${projectId}`).then((project: Project) => {
            if (typeof project.externalIds !== 'undefined') {
                setExternalIds(CommonUtils.convertObjectToMap(project.externalIds))
            }

            if (typeof project.externalUrls !== 'undefined') {
                setExternalUrls(CommonUtils.convertObjectToMap(project.externalUrls))
            }

            if (typeof project.additionalData !== 'undefined') {
                setAdditionalData(CommonUtils.convertObjectToMap(project.additionalData))
            }

            const projectPayloadData: ProjectSummaryPayload = {
                name: project.name,
                version: project.version,
                visibility: project.visibility,
                createdBy: project._embedded.createdBy.fullName,
                projectType: project.projectType,
                tag: project.tag,
                description: project.description,
                domain: project.domain,
                externalIds: project.externalIds,
                externalUrls:project.externalUrls,
                additionalData: project.additionalData
            }
            setProjectPayload(projectPayloadData)
        })
    }, [projectId, fetchData, setProjectPayload])

    const updateProject = async () => {
        const response = await ApiUtils.PATCH(`projects/${projectId}`, projectPayload, session.user.access_token)
        if (response.status == HttpStatus.OK) {
            await response.json()
            alert(true, 'success', t('Your project is updated'), 'success')
            // router.push('/projects')
        } else {
            alert(true, 'error', t('There are some errors while updating project'), 'danger')
            // router.push('/projects')
        }
    }

    const handleCancelClick = () => {
        router.push('/projects')
    }

    if (status === 'unauthenticated') {
        signOut()
    } else {
        return (
            <div className='container page-content'>
                <form
                    action=''
                    id='form_submit'
                    method='post'
                    onSubmit={(event) => {
                        event.preventDefault()
                    }}
                >
                    <ToastContainer position='top-start'>
                        <ToastMessage
                            show={toastData.show}
                            type={toastData.type}
                            message={toastData.message}
                            contextual={toastData.contextual}
                            onClose={() => setToastData({ ...toastData, show: false })}
                            setShowToast={setToastData}
                        />
                    </ToastContainer>
                    <div>
                        <Tab.Container defaultActiveKey='summary'>
                            <Row>
                                <Col sm='auto' className='me-3'>
                                    <ListGroup>
                                        <ListGroup.Item action eventKey='summary'>
                                            <div className='my-2'>{t('Summary')}</div>
                                        </ListGroup.Item>
                                        <ListGroup.Item action eventKey='administration'>
                                            <div className='my-2'>{t('Administration')}</div>
                                        </ListGroup.Item>
                                        <ListGroup.Item action eventKey='linkedProjectsAndReleases'>
                                            <div className='my-2'>{t('Linked Releases and Projects')}</div>
                                        </ListGroup.Item>
                                        <ListGroup.Item action eventKey='linkedPackages'>
                                            <div className='my-2'>{t('Linked Packages')}</div>
                                        </ListGroup.Item>
                                        <ListGroup.Item action eventKey='attachments'>
                                            <div className='my-2'>{t('Attachments')}</div>
                                        </ListGroup.Item>
                                        <ListGroup.Item action eventKey='obligations'>
                                            <div className='my-2'>{t('Obligations')}</div>
                                        </ListGroup.Item>
                                    </ListGroup>
                                </Col>
                                <Col className='me-3'>
                                    <Row className='d-flex justify-content-between'>
                                        <Col lg={3}>
                                            <Row>
                                                <Button
                                                    variant='primary'
                                                    type='submit'
                                                    className='me-2 col-auto'
                                                    onClick={updateProject}
                                                >
                                                    {t('Update Project')}
                                                </Button>
                                                <Button
                                                    variant='danger'
                                                    type='submit'
                                                    className='me-2 col-auto'
                                                    onClick={handleCancelClick}
                                                >
                                                    {t('Delete Project')}
                                                </Button>
                                                <Button
                                                    variant='secondary'
                                                    className='col-auto'
                                                    onClick={handleCancelClick}
                                                >
                                                    {t('Cancel')}
                                                </Button>
                                            </Row>
                                        </Col>
                                        <Col lg={4} className='text-truncate buttonheader-title'>
                                            {t('Update Project')}
                                        </Col>
                                    </Row>
                                    <Row className='mt-5'>
                                        <Tab.Content>
                                            <Tab.Pane eventKey='summary'>
                                                <Summary
                                                    vendor={vendor}
                                                    setVendor={setVendor}
                                                    externalUrls={externalUrls}
                                                    setExternalUrls={setExternalUrls}
                                                    setExternalUrlsData={setDataExternalUrls}
                                                    externalIds={externalIds}
                                                    setExternalIds={setExternalIds}
                                                    setExternalIdsData={setDataExternalIds}
                                                    additionalData={additionalData}
                                                    setAdditionalData={setAdditionalData}
                                                    setAdditionalDataObject={setDataAdditionalData}
                                                    projectPayload={projectPayload}
                                                    setProjectPayload={setProjectPayload}
                                                />
                                            </Tab.Pane>
                                            <Tab.Pane eventKey='administration'>
                                                <Administration
                                                    projectPayload={projectPayload}
                                                    setProjectPayload={setProjectPayload}
                                                />
                                            </Tab.Pane>
                                            <Tab.Pane eventKey='linkedProjectsAndReleases'>
                                                <LinkedReleasesAndProjects
                                                    projectPayload={projectPayload}
                                                    setProjectPayload={setProjectPayload}
                                                />
                                            </Tab.Pane>
                                            <Tab.Pane eventKey='attachments'></Tab.Pane>
                                            <Tab.Pane eventKey='obligations'></Tab.Pane>
                                        </Tab.Content>
                                    </Row>
                                </Col>
                            </Row>
                        </Tab.Container>
                    </div>
                </form>
            </div>
        )
    }
}

export default EditProject
