/* eslint-disable react/prop-types */
import React, { useCallback, useState } from 'react';
import { Modal, Form, Input, Select, Button, Col, Row } from 'antd';
import { useTranslation } from 'react-i18next';


const { Option } = Select;

const HandlerForm = ({ visible, onClose, onSubmit, initialValues, mode }) => {
    const [form] = Form.useForm();
    const { t } = useTranslation();
    const [dept, setDept] = useState([]);

    const loadDept = useCallback(() => {
        const savedDepts = JSON.parse(localStorage.getItem('depts')) || [];
        setDept(savedDepts);
    }, []);
    // Cập nhật form mỗi khi initialValues thay đổi
    React.useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues); // Set giá trị khởi tạo
        } else {
            form.resetFields(); // Xóa form khi không có giá trị
        }
        loadDept();
    }, [initialValues, form, loadDept]);
    const handleFinish = (values) => {
        onSubmit(initialValues ? { ...initialValues, ...values } : values);
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
      <Form form={form} onFinish={handleFinish} layout="vertical" initialValues={{dept: "Chờ xác nhận" }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: 'Please input the name!' }]}
            >
              <Input placeholder="Enter name" disabled={mode === 'view'} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please input the email!' },
                { type: 'email', message: 'Invalid email address!' },
              ]}
            >
              <Input placeholder="Enter email" disabled={mode === 'view'} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Phone"
              name="phone"
              // rules={[{ required: true, message: 'Please input the phone number!' }]}
            >
              <Input placeholder="Enter phone number" disabled={mode === 'view'} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Dept"
              name="dept"
              rules={[{ required: true, message: 'Please select the department!' }]}
            >
              <Select disabled={mode === 'view'} onFocus={loadDept} placeholder="Select department">
                {dept.map((item) => (
                  <Option key={item.department_code} value={item.department_code}>
                    {item.department_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
    );
};

export default HandlerForm;
