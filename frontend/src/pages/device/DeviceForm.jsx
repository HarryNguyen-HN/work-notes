/* eslint-disable react/prop-types */
import React, { useCallback, useState } from 'react';
import { Modal, Form, Input, DatePicker, Select, Button, Col, Row } from 'antd';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
// import dayjs from 'dayjs';
const { Option } = Select;

const DeviceForm = ({ visible, onClose, onSubmit, initialValues, mode }) => {
    const [form] = Form.useForm();
    const { t } = useTranslation();
    const [dept, setDept] = useState([]);
    const loadDept = useCallback(() => {
        const savedDepts = JSON.parse(localStorage.getItem('depts')) || [];
        setDept(savedDepts);
    }, []);
    React.useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                ...initialValues,
                purchase_date: initialValues.purchase_date
                    ? moment(initialValues.purchase_date, 'YYYY/MM/DD')
                    : null,
                warranty_expiry: initialValues.warranty_expiry
                    ? moment(initialValues.warranty_expiry, 'YYYY/MM/DD')
                    : null,
            });
        }
        loadDept();
    }, [initialValues, form, loadDept]);

    const handleFinish = (values) => {
        const parsedValues = {
            ...values,
            purchase_date: values.purchase_date ? values.purchase_date.format('YYYY/MM/DD') : moment().format('YYYY/MM/DD'),
            warranty_expiry: values.warranty_expiry ? values.warranty_expiry.format('YYYY/MM/DD') : moment().format('YYYY/MM/DD'),
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
                    <Col span={16}>
                        <Form.Item name="device_name" label={"Device name"}>
                            <Input disabled={mode === 'view'} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="category" label={"Category"}>
                            <Input disabled={mode === 'view'} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="quantity" label={"Quantity"}>
                            <Input disabled={mode === 'view'} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="status" label={"Status"}>
                            <Input disabled={mode === 'view'} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="purchase_date" label={"Ngày mua thiết bị"}>
                            <DatePicker format="YYYY/MM/DD" disabled={mode === 'view'} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="warranty_expiry" label={"Hạn bảo hành thiết bị"}>
                            <DatePicker format="YYYY/MM/DD" disabled={mode === 'view'} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="dept_id" label={"Bộ phận sở hữu"}>
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
                        <Form.Item name="location" label={"Location"}>
                            <Input disabled={mode === 'view'} />
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
export default DeviceForm;