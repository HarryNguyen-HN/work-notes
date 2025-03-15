import { useState, useEffect } from 'react';
import { Space, Table, Button, Modal, Dropdown, message, Upload } from 'antd';
import dayjs from 'dayjs';
import { EllipsisOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import DeptForm from './DeptForm';
import * as XLSX from 'xlsx';
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const Dept = () => {
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingRecord, setViewingRecord] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);

    // Load handlers from localStorage on component mount
    useEffect(() => {
        const storeData = JSON.parse(localStorage.getItem('depts')) || [];
        setData(storeData);
        message.success('Load data')
    }, []);

    // Save handlers to localStorage whenever they change
    useEffect(() => {
        if (data.length > 0) {
            localStorage.setItem('depts', JSON.stringify(data));
            message.success('Save')
        }
    }, [data]);

    const checkDuplicate = (values, excludeKey = null) => {
        return data.some(
            (item) =>
                item.key !== excludeKey && (item.name === values.dept_id /**|| data.email === values.email**/)
        );
    };

    const handleAdd = (values) => {

        // Check if the dept with the same name already exists
        if (checkDuplicate(values)) {
            message.error('Dept with the same name already exists');
            return;
        }
        // dữ liệu của handler mới
        const newDept = {
            key: String(data.length + 1),
            ...values,
        };
        // lưu dữ liệu handler mới vào cùng dữ liệu gốc
        setData([...data, newDept]);
        // đóng popup
        setIsModalOpen(false);
    };

    const handleUpdate = (updatedRecord) => {
        Modal.confirm({
            title: t('modal.saveChanges'),
            onOk: () => {
                const updatedData = data.map((item) =>
                    item.key === updatedRecord.key ? { ...item, ...updatedRecord } : item
                );
                setData(updatedData);
                setEditingRecord(null);
            },
        });
    };

    const handleDelete = (key) => {
        Modal.confirm({
            title: t('modal.deleteChanges'),
            onOk: () => {
                const updatedData = data.filter((item) => item.key !== key);
                setData(updatedData);
            },
        });
    };

    const handleViewDetail = (record) => {
        setViewingRecord(record);
    };

    const handleImportExcel = (event) => {
        const file = event.target.files[0];
        if (!file) {
            alert('Vui lòng chọn một file Excel.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                if (!workbook.SheetNames.includes('Dept')) {
                    alert('Sheet "Dept" không tồn tại trong file Excel.');
                    return;
                }

                const worksheet = workbook.Sheets['Dept'];
                const importedData = XLSX.utils.sheet_to_json(worksheet);

                if (importedData.length === 0) {
                    alert('Sheet "Dept" không chứa dữ liệu.');
                    return;
                }

                // Lọc hàng trống
                const filteredData = importedData.filter((row) =>
                    Object.values(row).some((value) => value?.toString().trim() !== '')
                );

                if (filteredData.length === 0) {
                    alert('Tất cả các hàng trong file Excel đều trống.');
                    return;
                }

                // Lấy dữ liệu đã có từ localStorage
                const existingData = JSON.parse(localStorage.getItem('depts')) || [];

                // Ánh xạ dữ liệu và xử lý lỗi undefined
                const mappedData = filteredData.map((row, index) => ({
                    id: `${index + 1}`,
                    dept_id: row['dept_id']?.toString().trim() || '',
                    dept_name: row['dept_name']?.toString().trim() || '',
                    dept_location: row['dept_location']?.toString().trim() || '',
                    content: row['content']?.toString().trim() || '',

                }));

                // Lọc trùng trong chính file Excel trước khi so sánh với dữ liệu cũ
                const uniqueImportedData = mappedData.filter((row, index, self) =>
                    index === self.findIndex((r) => r.dept_id === row.dept_id && r.dept_name === row.dept_name)
                );

                // Lọc trùng với dữ liệu đã có
                const newUniqueData = uniqueImportedData.filter(
                    (newItem) =>
                        !existingData.some(
                            (item) => item.dept_id === newItem.dept_id && item.dept_name === newItem.dept_name
                        )
                );

                if (newUniqueData.length === 0) {
                    alert('Tất cả dữ liệu trong file Excel đã tồn tại, không có dữ liệu mới để thêm.');
                    return;
                }

                // Cập nhật state & localStorage
                const updatedData = [...existingData, ...newUniqueData];
                setData(updatedData);
                localStorage.setItem('depts', JSON.stringify(updatedData));

                alert('Dữ liệu từ Excel đã được nhập thành công!');
            } catch (error) {
                console.error('Lỗi khi xử lý file Excel:', error);
                alert('Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra lại file.');
            }
        };

        reader.readAsArrayBuffer(file);
        return false;
    };

    // Hàm export dữ liệu ra file Excel
    const handleExportExcel = async () => {
        const exportColumns = [
            { key: "dept_id", title: "dept_id" },
            { key: "dept_name", title: "dept_name" },
            { key: "dept_location", title: "dept_location" },
            { key: "content", title: "content" },
        ];

        const headers = exportColumns.map(col => col.title);
        const keys = exportColumns.map(col => col.key);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Dept");

        // ** Thêm tiêu đề **
        const headerRow = worksheet.addRow(headers);

        // ** Định dạng tiêu đề **
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "4F81BD" }, // Xanh đậm
            };
            cell.font = { bold: true, color: { argb: "FFFFFF" }, size: 12 }; // Chữ trắng, đậm
            cell.alignment = { horizontal: "center", vertical: "middle" }; // Căn giữa
            cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        });

        // ** Thêm dữ liệu với màu nền xen kẽ **
        data.forEach((item, rowIndex) => {
            const rowData = keys.map(key => item[key] || ""); // Tránh null/undefined
            const row = worksheet.addRow(rowData);

            // Xác định màu nền xen kẽ
            const bgColor = rowIndex % 2 === 0 ? "F2F2F2" : "FFFFFF"; // Xám nhạt / Trắng

            row.eachCell((cell) => {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
                cell.alignment = { horizontal: "center", vertical: "middle" }; // Căn giữa trừ "content"
                cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
            });
        });

        // ** AutoFit cột **
        worksheet.columns.forEach((col, i) => {
            let maxLength = headers[i].length;
            data.forEach(row => {
                if (row[keys[i]]) {
                    maxLength = Math.max(maxLength, row[keys[i]].toString().length);
                }
            });
            col.width = maxLength + 4;
        });

        // ** Thêm bộ lọc dữ liệu **
        worksheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: headers.length },
        };

        // ** Xuất file Excel **
        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `Dept_Data_${dayjs().format("YYYY-MM-DD")}.xlsx`;
        saveAs(new Blob([buffer], { type: "application/octet-stream" }), fileName);
    };

    const columns = [
        {
            title: 'dept_name',
            dataIndex: 'dept_name',
            key: 'dept_name',
        },
        {
            title: 'dept_id',
            dataIndex: 'dept_id',
            key: 'dept_id',
        },
        {
            title: 'dept_location',
            dataIndex: 'dept_location',
            key: 'dept_location',
        },
        {
            title: 'content',
            dataIndex: 'content',
            key: 'content',
        },
        {
            title: t('menu.actions'),
            key: 'actions',
            ellipsis: true,
            render: (_, record) => (
                <Space>
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: '1',
                                    label: t('button.viewDetail'),
                                    onClick: () => handleViewDetail(record),
                                },
                                {
                                    key: '2',
                                    label: t('button.edit'),
                                    onClick: () => setEditingRecord(record),
                                },
                                {
                                    key: '3',
                                    label: t('button.delete'),
                                    danger: true,
                                    onClick: () => handleDelete(record.key),
                                },
                            ],
                        }}
                        trigger={['click']}
                    >
                        <Button shape="circle" icon={<EllipsisOutlined />} />
                    </Dropdown>
                </Space>
            ),
            width: 100,
        },
    ];

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <Button type="primary" onClick={() => setIsModalOpen(true)}>
                    {t('button.add')}
                </Button>
                <Button type="primary" onClick={() => localStorage.removeItem('depts')}>
                    xoá data
                </Button>
                <Upload
                    accept=".xlsx,.xls"
                    showUploadList={false}
                    beforeUpload={(file) => {
                        // Kiểm tra xem file có hợp lệ không
                        if (!['.xlsx', '.xls'].includes(file.name.slice(-5))) {
                            message.error(t('upload.invalidFileType'));
                            return false;
                        }
                        handleImportExcel({ target: { files: [file] } }); // Gọi hàm xử lý nhập dữ liệu
                        return false; // Ngừng tải lên
                    }}
                >
                    <Button type='primary' icon={<UploadOutlined />}>{t('button.importData')}</Button>
                </Upload>
                {/* Thêm nút Export */}
                <Button type="primary" onClick={handleExportExcel}>
                    {t('button.exportData')}
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={data}
                scroll={{ x: 'max-content', y: 300 }}
                pagination={{ pageSize: 1000 }}
                style={{ whiteSpace: 'nowrap' }}
            />
            {isModalOpen && (
                <DeptForm
                    visible={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleAdd}
                    modalStyle={{ width: '500px', maxHeight: '80vh' }}
                    mode="add"
                />
            )}
            {editingRecord && (
                <DeptForm
                    visible={!!editingRecord}
                    onClose={() => setEditingRecord(null)}
                    onSubmit={handleUpdate}
                    initialValues={editingRecord}
                    modalStyle={{ width: '500px', height: '80vh' }}
                    mode="edit"
                />
            )}
            {viewingRecord && (
                <DeptForm
                    visible={!!viewingRecord}
                    onClose={() => setViewingRecord(null)}
                    initialValues={viewingRecord}
                    modalStyle={{ width: '500px', height: '80vh' }}
                    mode="view"
                />
            )}
        </div>
    );
};

export default Dept;
