/* eslint-disable react/prop-types */
import React, { useCallback, useState } from 'react';
import { Modal, Form, Input, DatePicker, Select, Button, Col, Row } from 'antd';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import dayjs from 'dayjs';
const { Option } = Select;

const MISArchiveForm = ({ visible, onClose, onSubmit, initialValues, mode }) => {
    const [form] = Form.useForm();
    const { t } = useTranslation();
    const [member, setMember] = useState([]);
    const [dept, setDept] = useState([]);
    const [device, setDevice] = useState([]);
    const loadMember = useCallback(() => {
        const savedMembers = JSON.parse(localStorage.getItem('members')) || [];
        setMember(savedMembers);
    }, []);
    const loadDept = useCallback(() => {
        const savedDepts = JSON.parse(localStorage.getItem('depts')) || [];
        setDept(savedDepts);
    }, []);
    const loadDevice = useCallback(() => {
        const saveDevice = JSON.parse(localStorage.getItem('device')) || [];
        setDevice(saveDevice);
    }, []);
    React.useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                ...initialValues,
                date: initialValues.date
                    ? dayjs(initialValues.date, 'YYYY/MM/DD')
                    : null,
            });
        }
        loadMember();
        loadDept();
        loadDevice();
    }, [initialValues, form, loadMember, loadDept, loadDevice]);

    const handleFinish = (values) => {
        const parsedValues = {
            ...values,
            date: values.date ? values.date.format('YYYY/MM/DD') : moment().format('YYYY/MM/DD'),
        };
        onSubmit(initialValues ? { ...initialValues, ...parsedValues } : parsedValues);
        form.resetFields();
    };

    return (
        <Modal
            title={mode === 'view' ? 'View Details' : mode === 'edit' ? 'Edit' : 'Add New'}
            open={visible}
            onCancel={onClose}
            footer={
                mode === 'view' ? (
                    <Button onClick={onClose}>{t('button.close')}</Button>
                ) : (
                    <>
                        <Button onClick={onClose}>{t('button.cancel')}</Button>
                        <Button type="primary" onClick={() => form.submit()}>
                            {mode === 'add' ? t('button.add') : t('button.save')}
                        </Button>
                    </>
                )
            }
        >
            <Form form={form} onFinish={handleFinish} layout="vertical" initialValues={{ date: moment(), act: "give" }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="date" label={"Date"}>
                            <DatePicker format="YYYY/MM/DD" disabled={mode === 'view'} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="act" label={t("jobTracker.act")}>
                            <Select disabled={mode === 'view'}>
                                <Option value="receive">{t("jobTracker.device_moved_to_storage")}</Option>
                                <Option value="give">{t("jobTracker.device_moved_out_storage")}</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={18}>
                        {/* <Form.Item name="device_id" label={"Device name"}>
                            <Input disabled={mode === 'view'} />
                        </Form.Item> */}
                        <Form.Item name="device_id" label={"Device name"}>
                            <Select
                                disabled={mode === 'view'}
                                options={device.map(d => ({ value: d.device_id, label: d.device_name }))}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="quantity" label={"Quantity"}>
                            <Input disabled={mode === 'view'} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="dept" label={"Dept-Received"}>
                            <Select showSearch disabled={mode === 'view'} onClick={loadDept}>
                                {dept.map((item) => (
                                    <Option key={item.dept_id} value={item.dept_id}>
                                        {item.dept_id}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="receiver" label={"Receiver"}>
                            <Select showSearch disabled={mode === 'view'} onClick={loadMember}>
                                {member.map((item) => (
                                    <Option key={item.member_code} value={item.member_code + ' ' + item.full_name + ' ' + item.username}>
                                        {item.member_code + ' ' + item.full_name + ' ' + item.username}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item name="content" label={t('jobTracker.content')}>
                    <Input.TextArea rows={4} disabled={mode === 'view'} />
                </Form.Item>
            </Form>
        </Modal>
    );
};
export default MISArchiveForm;