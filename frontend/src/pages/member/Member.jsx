import { useState, useEffect, useRef } from 'react';
import { Space, Table, Button, Modal, Dropdown, message, Upload, Input } from 'antd';
import MemberForm from './MemberForm';
import dayjs from 'dayjs';
import { EllipsisOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const Member = () => {
    const { t } = useTranslation();
    const [members, setMembers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingRecord, setViewingRecord] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);
    // State để lưu số lượng items trên mỗi trang
    const [pageSize, setPageSize] = useState(10);
    // Xử lý khi thay đổi số lượng item trong mỗi trang
    const handlePageSizeChange = (current, newPageSize) => {
        setPageSize(newPageSize);
    };

    // Load handlers from localStorage on component mount
    useEffect(() => {
        const savedHandlers = JSON.parse(localStorage.getItem('members')) || [];
        setMembers(savedHandlers);
        // message.success('Load handler')
    }, []);

    // Save handlers to localStorage whenever they change
    useEffect(() => {
        if (members.length > 0) {
            localStorage.setItem('members', JSON.stringify(members));
            message.success('Save')
        }
    }, [members]);

    const checkDuplicate = (values, excludeKey = null) => {
        return members.some(
            (member) =>
                member.key !== excludeKey && (member.username === values.username || member.email === values.email)
        );
    };

    const handleAdd = (values) => {

        // Check if the handler with the same name or email already exists
        if (checkDuplicate(values)) {
            message.error('Member with the same name or email already exists');
            return;
        }
        // dữ liệu của handler mới
        const newMember = {
            id: String(members.length > 0 ? Number(members[members.length - 1].id) + 1 : 1),
            ...values,
        };
        // lưu dữ liệu handler mới vào cùng dữ liệu gốc
        setMembers([...members, newMember]);
        // đóng popup
        setIsModalOpen(false);
    };

    const handleUpdate = (updatedRecord) => {
        Modal.confirm({
            title: t('modal.saveChanges'),
            onOk: () => {
                const updatedData = members.map((item) =>
                    item.id === updatedRecord.id ? { ...item, ...updatedRecord } : item
                );
                setMembers(updatedData);
                setEditingRecord(null);
            },
        });
    };

    const handleDelete = (key) => {
        Modal.confirm({
            title: t('modal.deleteChanges'),
            onOk: () => {
                const updatedData = members.filter((item) => item.id !== key);
                setMembers(updatedData);
            },
        });
    };

    const handleViewDetail = (record) => {
        setViewingRecord(record);
    };

    // Chỉnh sửa phần mappedData và updatedData trong handleImportExcel
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

                if (!workbook.SheetNames.includes('Members')) {
                    alert('Sheet "Members" không tồn tại trong file Excel.');
                    return;
                }

                const worksheet = workbook.Sheets['Members'];
                const importedData = XLSX.utils.sheet_to_json(worksheet);

                if (importedData.length === 0) {
                    alert('Sheet "Members" không chứa dữ liệu.');
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
                const existingData = JSON.parse(localStorage.getItem('members')) || [];

                // Ánh xạ dữ liệu và xử lý lỗi undefined
                const mappedData = filteredData.map((row, index) => ({
                    id: `${index + 1}`,
                    member_code: row['Mã nhân viên']?.toString().trim() || '',
                    full_name: row['Họ và tên']?.toString().trim() || '',
                    username: row['Username']?.toString().trim() || '',
                    email: row['Email']?.toString().trim() || '',
                    dept: row['Dept']?.toString().trim() || '',
                    content: row['Content']?.toString().trim() || '',
                }));

                // Lọc trùng trong chính file Excel trước khi so sánh với dữ liệu cũ
                const uniqueImportedData = mappedData.filter((row, index, self) =>
                    index === self.findIndex((r) => r.member_code === row.member_code && r.email === row.email)
                );

                // Lọc trùng với dữ liệu đã có
                const newUniqueData = uniqueImportedData.filter(
                    (newItem) =>
                        !existingData.some(
                            (item) => item.member_code === newItem.member_code && item.email === newItem.email
                        )
                );

                if (newUniqueData.length === 0) {
                    alert('Tất cả dữ liệu trong file Excel đã tồn tại, không có dữ liệu mới để thêm.');
                    return;
                }

                // Cập nhật state & localStorage
                const updatedData = [...existingData, ...newUniqueData];
                setMembers(updatedData);
                localStorage.setItem('members', JSON.stringify(updatedData));

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
            { key: "dept", title: "Dept" },
            { key: "member_code", title: "Mã nhân viên" },
            { key: "full_name", title: "Họ và tên" },
            { key: "username", title: "Username" },
            { key: "email", title: "Email" },
            { key: "content", title: "Content" }, // Không căn giữa
        ];

        const headers = exportColumns.map(col => col.title);
        const keys = exportColumns.map(col => col.key);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Member");

        // ** Thêm tiêu đề **
        const headerRow = worksheet.addRow(headers);

        // ** Định dạng tiêu đề **
        headerRow.eachCell(cell => {
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
        members.forEach((item, rowIndex) => {
            const rowData = keys.map(key => item[key] || ""); // Tránh null/undefined
            const row = worksheet.addRow(rowData);

            // Xác định màu nền xen kẽ
            const bgColor = rowIndex % 2 === 0 ? "F2F2F2" : "FFFFFF"; // Xám nhạt / Trắng

            row.eachCell((cell, colIndex) => {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
                cell.alignment = {
                    horizontal: keys[colIndex] === "content" ? "left" : "center", // Cột "Content" căn trái, còn lại căn giữa
                    vertical: "middle",
                };
                cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
            });
        });

        // ** AutoFit cột **
        worksheet.columns.forEach((col, i) => {
            let maxLength = headers[i].length;
            members.forEach(row => {
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
        const fileName = `Member_Data_${dayjs().format("YYYY-MM-DD")}.xlsx`;
        saveAs(new Blob([buffer], { type: "application/octet-stream" }), fileName);
    };

    // handleSearch start
    // const [searchText, setSearchText] = useState('');
    const searchInput = useRef(null);

    const handleSearch = (selectedKeys, confirm) => {
        confirm();
        // setSearchText(selectedKeys[0]);
    };

    const handleReset = (clearFilters) => {
        clearFilters();
        // setSearchText('');
    };
    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <Input
                    ref={searchInput}
                    placeholder={`Tìm kiếm...`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm)}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Tìm kiếm
                    </Button>
                    <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
                        Reset
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
        onFilter: (value, record) =>
            record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase()),
        filterDropdownProps: {
            onOpenChange: (visible) => {
                if (visible) {
                    setTimeout(() => searchInput.current?.select(), 100);
                }
            },
        },
    });
    // handleSearch end

    const columns = [
        {
            title: t('jobTracker.stt'),
            dataIndex: 'id',
            key: 'id',
            width: 60,
            align: 'center',
            // ellipsis: true,
            sorter: (a, b) => Number(a.id) - Number(b.id),
            sortDirections: ['descend', 'ascend'],
        },
        {
            title: 'Mã nhân viên',
            dataIndex: 'member_code',
            key: 'member_code',
            width: 150,
            align: 'center',
            sorter: (a, b) => String(a.member_code || '').trim().localeCompare(String(b.member_code || '').trim(), 'en', { numeric: true }),
            sortDirections: ['descend', 'ascend'],
            ...getColumnSearchProps('member_code'),
        },

        {
            title: 'Họ và tên',
            dataIndex: 'full_name',
            key: 'full_name',
            align: 'center',
            ellipsis: true,
            sorter: (a, b) => (a.full_name || "").localeCompare(b.full_name || ""),
            sortDirections: ['descend', 'ascend'],
            ...getColumnSearchProps('full_name'),
        },
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            align: 'center',
            ellipsis: true,
            sorter: (a, b) => (a.username || "").toLowerCase().localeCompare((b.username || "").toLowerCase(), 'en', { numeric: true }),
            sortDirections: ['descend', 'ascend'],
            ...getColumnSearchProps('username'),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            ellipsis: true,
            sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
            sortDirections: ['descend', 'ascend'],
            ...getColumnSearchProps('email'),
        },
        {
            title: 'Dept',
            dataIndex: 'dept',
            key: 'dept',
            ellipsis: true,
            sorter: (a, b) => (a.dept || "").localeCompare(b.dept || ""),
            sortDirections: ['descend', 'ascend'],
            ...getColumnSearchProps('dept'),
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
                                    onClick: () => handleDelete(record.id),
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
                <Button type="primary" onClick={() => localStorage.removeItem('members')}>
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
                rowKey={(record) => record.member_code || record.id || Math.random().toString()}
                columns={columns}
                dataSource={members}
                scroll={{ x: 'max-content', y: 300 }}
                style={{ whiteSpace: 'nowrap' }}
                pagination={{
                    pageSize, // Sử dụng pageSize từ state
                    showSizeChanger: true, // Cho phép người dùng thay đổi pageSize
                    pageSizeOptions: [5, 10, 20, 50, members.length],
                    onShowSizeChange: handlePageSizeChange,
                }}
            />
            {isModalOpen && (
                <MemberForm
                    visible={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleAdd}
                    modalStyle={{ width: '500px', maxHeight: '80vh' }}
                    mode="add"
                />
            )}
            {editingRecord && (
                <MemberForm
                    visible={!!editingRecord}
                    onClose={() => setEditingRecord(null)}
                    onSubmit={handleUpdate}
                    initialValues={editingRecord}
                    modalStyle={{ width: '500px', height: '80vh' }}
                    mode="edit"
                />
            )}
            {viewingRecord && (
                <MemberForm
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

export default Member;
