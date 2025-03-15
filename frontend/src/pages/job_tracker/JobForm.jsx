/* eslint-disable react/prop-types */
import React, { useCallback, useState } from 'react';
import { Modal, Form, Input, DatePicker, Select, Button, Col, Row } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import moment from 'moment';

const { Option } = Select;

const JobForm = ({ visible, onClose, onSubmit, initialValues, mode }) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [handler, setHandler] = useState([]);
  const [dept, setDept] = useState([]);
  const loadHandler = useCallback(() => {
    const savedHandlers = JSON.parse(localStorage.getItem('handlers')) || [];
    setHandler(savedHandlers);
  }, []);
  const loadDept = useCallback(() => {
    const savedDepts = JSON.parse(localStorage.getItem('depts')) || [];
    setDept(savedDepts);
  }, []);
  React.useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        receivedTime: initialValues.receivedTime
          ? dayjs(initialValues.receivedTime, 'YYYY/MM/DD')
          : null,
        completedTime: initialValues.completedTime
          ? dayjs(initialValues.completedTime, 'YYYY/MM/DD')
          : null,
      });
    }
    loadHandler();
    loadDept();
  }, [initialValues, form, loadHandler, loadDept]);

  const handleFinish = (values) => {
    const parsedValues = {
      ...values,
      receivedTime: values.receivedTime?.format('YYYY/MM/DD'),
      completedTime: values.completedTime?.format('YYYY/MM/DD'),
    };
    onSubmit(initialValues ? { ...initialValues, ...parsedValues } : parsedValues);
    form.resetFields();
  };

  return (
    <Modal
      title={mode === 'view' ? 'View Job Details' : mode === 'edit' ? 'Edit Job' : 'Add New Job'}
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
      <Form form={form} onFinish={handleFinish} layout="vertical" initialValues={{dept_id: "Chờ xác nhận", site: "VN", level: "Level 1", numberOfOccurrences: 1,handler: ["Harry"], receivedTime: moment() }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="job" label={t('jobTracker.job')}>
              <Input disabled={mode === 'view'} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="dept_id" label={t('jobTracker.dept')}>
              <Select showSearch disabled={mode === 'view'} onClick={loadDept}>
                {dept.map((item) => (
                  <Option key={item.dept_id} value={item.dept_id}>
                    {item.dept_id}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="numberOfOccurrences" label={t('jobTracker.numberOfOccurrences')}>
              <Input disabled={mode === 'view'} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="handler" label={t('jobTracker.handler')}>
              <Select mode="multiple" disabled={mode === 'view'} onClick={loadHandler}>
                {handler.map((item) => (
                  <Option key={item.name} value={item.name}>
                    {item.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="content" label={t('jobTracker.content')}>
          <Input.TextArea rows={4} disabled={mode === 'view'} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="processingTime" label={t('jobTracker.processingTime')}>
              <Input disabled={mode === 'view'} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="site" label={t('jobTracker.site')}>
              <Select disabled={mode === 'view'}>
                <Option value="VN">VN</Option>
                <Option value="CN">CN</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="level" label={t('jobTracker.level')}>
              <Select disabled={mode === 'view'}>
                <Option value="Level 1">Level 1</Option>
                <Option value="Level 2">Level 2</Option>
                <Option value="Level 3">Level 3</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="type" label={t('jobTracker.type')}>
              <Select disabled={mode === 'view'}>
                <Option value="Exception">Exception</Option>
                <Option value="Request">Request</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="abnormal" label={t('jobTracker.abnormal')}>
              <Select disabled={mode === 'view'}>
                <Option value="System">System</Option>
                <Option value="Other">Other</Option>
                <Option value="Forescout">Forescout</Option>
                <Option value="MDE">MDE</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="receivedTime" label={t('jobTracker.receivedTime')}>
              <DatePicker format="YYYY/MM/DD" disabled={mode === 'view'} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="completedTime" label={t('jobTracker.completedTime')}>
          <DatePicker format="YYYY/MM/DD" disabled={mode === 'view'} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default JobForm;
/*
<Modal
      title={mode === 'view' ? 'View Job Details' : mode === 'edit' ? 'Edit Job' : 'Add New Job'}
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
      <Form form={form} onFinish={handleFinish} layout="vertical">
        <Form.Item name="job" label={t('jobTracker.job')}>
          <Input disabled={mode === 'view'} />
        </Form.Item>
        <Form.Item name="dept" label={t('jobTracker.dept')}>
          <Select disabled={mode === 'view'} onClick={() => loadDept()}>
            {
              dept.map((item) => {
                return (
                  <Option
                    key={item.department_code}
                    value={item.department_code}
                  >
                    {dept.department_code}
                  </Option>
                )
              })
            }
          </Select>
        </Form.Item>
        <Form.Item name="numberOfOccurrences" label={t('jobTracker.numberOfOccurrences')}>
          <Input disabled={mode === 'view'} />
        </Form.Item>
        <Form.Item name="handler" label={t('jobTracker.handler')}>
          <Select mode="multiple" disabled={mode === 'view'} onClick={() => loadHandler()}>
            {
              handler.map((item) => {
                return (
                  <Option key={item.name} value={item.name}>{handler.name}</Option>
                )
              })
            }
          </Select>
        </Form.Item>
        <Form.Item name="content" label={t('jobTracker.content')}>
          <Input.TextArea rows={4} disabled={mode === 'view'} />
        </Form.Item>
        <Form.Item name="processingTime" label={t('jobTracker.processingTime')}>
          <Input disabled={mode === 'view'} />
        </Form.Item>
        <Form initialValues={{ site: "VN" }}>
          <Form.Item name="site" label={t('jobTracker.site')}>
            <Select disabled={mode === 'view'}>
              <Option value="VN">VN</Option>
              <Option value="CN">CN</Option>
            </Select>
          </Form.Item>
        </Form>
        <Form initialValues={{ level: "Level 1" }}>
          <Form.Item name="level" label={t('jobTracker.level')}>
            <Select disabled={mode === 'view'}>
              <Option value="Level 1">Level 1</Option>
              <Option value="Level 2">Level 2</Option>
              <Option value="Level 3">Level 3</Option>
            </Select>
          </Form.Item></Form>
        <Form.Item name="type" label={t('jobTracker.type')}>
          <Select disabled={mode === 'view'}>
            <Option value="Exception">Exception</Option>
            <Option value="Request">Request</Option>
            <Option value="Other">Other</Option>
          </Select>
        </Form.Item>
        <Form.Item name="abnormal" label={t('jobTracker.abnormal')}>
          <Select disabled={mode === 'view'}>
            <Option value="System">System</Option>
            <Option value="Other">Other</Option>
            <Option value="Forescout">Forescout</Option>
            <Option value="MDE">MDE</Option>
          </Select>
        </Form.Item>


        <Form.Item name="receivedTime" label={t('jobTracker.receivedTime')}>
          <DatePicker
            format="YYYY/MM/DD"
            disabled={mode === 'view'}
          />
        </Form.Item>
        <Form.Item name="completedTime" label={t('jobTracker.completedTime')}>
          <DatePicker
            format="YYYY/MM/DD"
            disabled={mode === 'view'}
          />
        </Form.Item>
      </Form>
    </Modal>
*/