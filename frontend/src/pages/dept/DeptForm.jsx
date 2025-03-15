/* eslint-disable react/prop-types */
import React from 'react';
import { Modal, Form, Input, Select, Button, Col, Row } from 'antd';
import { useTranslation } from 'react-i18next';


const { Option } = Select;

const DeptForm = ({ visible, onClose, onSubmit, initialValues, mode }) => {
    const [form] = Form.useForm();
    const { t } = useTranslation();
    // Cập nhật form mỗi khi initialValues thay đổi
    React.useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues); // Set giá trị khởi tạo
        } else {
            form.resetFields(); // Xóa form khi không có giá trị
        }
    }, [initialValues, form]);
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
      <Form
        form={form}
        onFinish={handleFinish}
        layout="vertical"
        initialValues={{
        //   dept_location: "F3",
          content: "Chờ xác nhận",
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="dept_name"
              name="dept_name"
              rules={[{ required: true, message: 'Please input the department name!' }]}
            >
              <Input placeholder="Enter department name" disabled={mode === 'view'} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="dept_id"
              name="dept_id"
              rules={[{ required: true, message: 'Please input the department id!' }]}
            >
              <Input placeholder="Enter department id" disabled={mode === 'view'} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="dept_location"
              name="dept_location"
              rules={[{ required: true, message: 'Please input the department location!' }]}
            >
              <Input placeholder="Enter department location" disabled={mode === 'view'} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="content"
              name="content"
              rules={[{ required: true, message: 'Please input the content!' }]}
            >
              <Select disabled={mode === 'view'}>
                <Option value="Chờ xác nhận">Chờ xác nhận</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
    );
};

export default DeptForm;
