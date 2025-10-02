import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    // Типы
    type Edge, type Block, type Tag, type BaseCustomization, type TagCustomization,
    // CRUD Customization
    getEdgeCustomizationForAdmin, createEdgeCustomization, updateEdgeCustomization, deleteEdgeCustomization,
    getBlockCustomizationForAdmin, createBlockCustomization, updateBlockCustomization, deleteBlockCustomization,
    getTagCustomizationForAdmin, createTagCustomization, updateTagCustomization, deleteTagCustomization,
    // Зависимости
    getEdgesForAdmin, getBlocksForAdmin, getTagsForAdmin 
} from '../../api/admin'; 

// --- PrimeReact Компоненты ---
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';

// Тип для компонента
type CustomizationType = 'edge' | 'block' | 'tag';

interface Props {
    title: string;
    type: CustomizationType;
}

// Объединяющий тип данных для строк таблицы
type CustomizationData = BaseCustomization | TagCustomization;

// --- КОМПОНЕНТ ФОРМЫ ---
const CustomizationForm: React.FC<{ 
    initialData?: CustomizationData | null; 
    onClose: () => void; 
    type: CustomizationType;
}> = ({ initialData, onClose, type }) => {
    const queryClient = useQueryClient();
    const isEdit = !!initialData;
    const initialTagData = initialData as TagCustomization | undefined;
    const initialBaseData = initialData as BaseCustomization | undefined;

    // Состояния полей
    const [edgeId, setEdgeId] = useState(initialTagData?.edge_id || initialBaseData?.edge_id || '');
    const [blockId, setBlockId] = useState(initialBaseData?.block_id || '');
    const [tagId, setTagId] = useState(initialTagData?.tag_id || '');
    const [key, setKey] = useState(initialData?.key || '');
    const [value, setValue] = useState(initialData?.value || '');
    const [error, setError] = useState('');

    // Загрузка списков зависимостей
    const { data: edges, isLoading: isEdgesLoading } = useQuery<Edge[]>({
        queryKey: ['edges'],
        queryFn: getEdgesForAdmin,
        staleTime: Infinity,
        enabled: type !== 'block', // Не нужен для block-customization
    });

    const { data: blocks, isLoading: isBlocksLoading } = useQuery<Block[]>({
        queryKey: ['blocks'],
        queryFn: getBlocksForAdmin,
        staleTime: Infinity,
        enabled: type === 'block', // Нужен только для block-customization
    });

    const { data: tags, isLoading: isTagsLoading } = useQuery<Tag[]>({
        queryKey: ['tags'],
        queryFn: getTagsForAdmin,
        staleTime: Infinity,
        enabled: type === 'tag', // Нужен только для tag-customization
    });
    
    // Определяем функции CRUD в зависимости от типа
    const mutationFn = useMemo(() => {
        if (type === 'edge') {
            return isEdit 
                ? (data: any) => updateEdgeCustomization(edgeId, key, data)
                : (data: any) => createEdgeCustomization(data);
        }
        if (type === 'block') {
            return isEdit 
                ? (data: any) => updateBlockCustomization(blockId, key, data)
                : (data: any) => createBlockCustomization(data);
        }
        if (type === 'tag') {
            return isEdit 
                ? (data: any) => updateTagCustomization(edgeId, tagId, key, data)
                : (data: any) => createTagCustomization(data);
        }
    }, [type, isEdit, edgeId, blockId, tagId, key]);

    const mutation = useMutation({
        mutationFn: mutationFn as (data: any) => Promise<any>,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${type}-customization`] });
            onClose();
        },
        onError: (err: any) => {
            setError(err.message || 'Ошибка выполнения операции.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        let payload: any = { key, value };
        let valid = value && key;

        if (type === 'edge') {
            payload.edge_id = edgeId;
            valid = valid && edgeId;
        } else if (type === 'block') {
            payload.block_id = blockId;
            valid = valid && blockId;
        } else if (type === 'tag') {
            payload.edge_id = edgeId;
            payload.tag_id = tagId;
            valid = valid && edgeId && tagId;
        }
        
        if (!valid || (!isEdit && (type !== 'tag' && !key))) {
             setError('Не все обязательные поля заполнены.');
             return;
        }

        // При редактировании отправляем только 'value', т.к. key и id уже в URL
        const dataToSend = isEdit ? { value } : payload;
        
        mutation.mutate(dataToSend);
    };

    const inputStyle = { backgroundColor: '#1e1e2f', borderColor: '#3a3c53' };
    const labelStyle = { color: '#a0a2b8' };
    const commonDropdownProps = { 
        optionLabel: 'name',
        optionValue: 'id',
        filter: true,
        disabled: mutation.isPending,
        required: true,
        style: inputStyle
    };

    return (
        <form onSubmit={handleSubmit} className="p-fluid">
            {error && <Message severity="error" text={error} className="mb-3" />}
            
            {/* Поля для Edge Customization и Tag Customization */}
            {(type === 'edge' || type === 'tag') && (
                <div className="field">
                    <label htmlFor="edgeId" className="font-semibold mb-2 block" style={labelStyle}>ID Буровой</label>
                    <Dropdown 
                        id="edgeId" 
                        value={edgeId} 
                        onChange={(e) => setEdgeId(e.value)} 
                        options={edges}
                        placeholder={isEdgesLoading ? 'Загрузка буровых...' : 'Выберите буровую'}
                        {...commonDropdownProps}
                        disabled={isEdit || mutation.isPending || isEdgesLoading}
                    />
                </div>
            )}
            
            {/* Поле для Block Customization */}
            {type === 'block' && (
                <div className="field">
                    <label htmlFor="blockId" className="font-semibold mb-2 block" style={labelStyle}>ID Блока</label>
                    <Dropdown 
                        id="blockId" 
                        value={blockId} 
                        onChange={(e) => setBlockId(e.value)} 
                        options={blocks}
                        placeholder={isBlocksLoading ? 'Загрузка блоков...' : 'Выберите блок'}
                        {...commonDropdownProps}
                        disabled={isEdit || mutation.isPending || isBlocksLoading}
                    />
                </div>
            )}

            {/* Поле для Tag Customization */}
            {type === 'tag' && (
                <div className="field mt-3">
                    <label htmlFor="tagId" className="font-semibold mb-2 block" style={labelStyle}>ID Тега</label>
                    <Dropdown 
                        id="tagId" 
                        value={tagId} 
                        onChange={(e) => setTagId(e.value)} 
                        options={tags}
                        placeholder={isTagsLoading ? 'Загрузка тегов...' : 'Выберите тег'}
                        {...commonDropdownProps}
                        disabled={isEdit || mutation.isPending || isTagsLoading}
                    />
                </div>
            )}

            {/* Поле КЛЮЧА (Key) */}
            <div className="field mt-3">
                <label htmlFor="key" className="font-semibold mb-2 block" style={labelStyle}>Ключ (Key)</label>
                <InputText 
                    id="key" 
                    value={key} 
                    onChange={(e) => setKey(e.target.value)} 
                    disabled={isEdit || mutation.isPending} 
                    required 
                    style={inputStyle}
                />
            </div>
            
            {/* Поле ЗНАЧЕНИЕ (Value) */}
            <div className="field mt-3">
                <label htmlFor="value" className="font-semibold mb-2 block" style={labelStyle}>Значение (Value)</label>
                <InputText 
                    id="value" 
                    value={value} 
                    onChange={(e) => setValue(e.target.value)} 
                    required 
                    disabled={mutation.isPending} 
                    style={inputStyle}
                />
            </div>

            <div className="flex justify-content-center gap-4 edge-form-footer">
                <Button 
                    icon="pi pi-check" 
                    type="submit" 
                    loading={mutation.isPending} 
                    tooltip={isEdit ? 'Сохранить' : 'Создать'} 
                    className="p-button-rounded" 
                    style={{backgroundColor: '#6c5dd3', borderColor: '#6c5dd3', width: '2.5rem', height: '2.5rem', padding: '0'}} 
                />
                <Button 
                    icon="pi pi-times" 
                    onClick={onClose} 
                    className="p-button-danger p-button-rounded" 
                    disabled={mutation.isPending} 
                    tooltip="Отмена" 
                    style={{width: '2.5rem', height: '2.5rem', padding: '0'}}
                />
            </div>
        </form>
    );
};


// --- ОСНОВНОЙ КОМПОНЕНТ ТАБЛИЦЫ ---
export default function CustomizationTable({ title, type }: Props) {
    const queryClient = useQueryClient();
    const [openForm, setOpenForm] = useState(false);
    const [selectedData, setSelectedData] = useState<CustomizationData | null>(null);

    // Динамически выбираем функцию получения данных
    const fetchFn = useMemo(() => {
        if (type === 'edge') return getEdgeCustomizationForAdmin;
        if (type === 'block') return getBlockCustomizationForAdmin;
        if (type === 'tag') return getTagCustomizationForAdmin;
    }, [type]);

    const { data, isLoading, error: queryError } = useQuery<CustomizationData[]>({
        queryKey: [`${type}-customization`],
        queryFn: fetchFn,
    });
    
    const deleteMutation = useMutation({
        mutationFn: (data: CustomizationData) => {
            // Утверждаем типы, чтобы получить ключи
            const tagData = data as TagCustomization;
            const baseData = data as BaseCustomization;
            
            if (type === 'edge' && baseData.edge_id) {
                // Вызываем функцию с 2 аргументами (edgeId, key)
                return deleteEdgeCustomization(baseData.edge_id, baseData.key);
            }
            if (type === 'block' && baseData.block_id) {
                // Вызываем функцию с 2 аргументами (blockId, key)
                return deleteBlockCustomization(baseData.block_id, baseData.key);
            }
            if (type === 'tag' && tagData.edge_id && tagData.tag_id) {
                // Вызываем функцию с 3 аргументами (edgeId, tagId, key)
                return deleteTagCustomization(tagData.edge_id, tagData.tag_id, tagData.key);
            }
            
            // Защита, если ни одно условие не сработало (хотя не должно)
            return Promise.reject(new Error("Невозможно определить ключ для удаления."));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${type}-customization`] });
        },
    });

    const handleCreate = () => {
        setSelectedData(null);
        setOpenForm(true);
    };

    const handleEdit = (data: CustomizationData) => {
        setSelectedData(data);
        setOpenForm(true);
    };

    const handleHideForm = () => {
        setOpenForm(false);
        setSelectedData(null);
    };

    const confirmDelete = (data: CustomizationData) => {
        confirmDialog({
            message: `Вы уверены, что хотите удалить ключ "${data.key}"?`,
            header: 'Подтверждение удаления',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => deleteMutation.mutate(data),
        });
    };

    const actionBodyTemplate = (rowData: CustomizationData) => {
        return (
            <div className='flex gap-2'>
                <Button icon="pi pi-pencil" rounded text onClick={() => handleEdit(rowData)} />
                <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => confirmDelete(rowData)} />
            </div>
        );
    };
    
    // Динамически определяем колонки
    const dynamicColumns = useMemo(() => {
        const baseColumns = [
            <Column key="key" field="key" header="Ключ (Key)" sortable style={{ width: '25%' }} />,
            <Column key="value" field="value" header="Значение (Value)" sortable style={{ width: '40%' }} />,
        ];
        
        if (type === 'edge') {
            return [
                <Column key="edge_id" field="edge_id" header="ID Буровой" sortable style={{ width: '20%' }} />,
                ...baseColumns,
            ];
        }
        if (type === 'block') {
            return [
                <Column key="block_id" field="block_id" header="ID Блока" sortable style={{ width: '20%' }} />,
                ...baseColumns,
            ];
        }
        if (type === 'tag') {
            return [
                <Column key="edge_id" field="edge_id" header="ID Буровой" sortable style={{ width: '15%' }} />,
                <Column key="tag_id" field="tag_id" header="ID Тега" sortable style={{ width: '15%' }} />,
                ...baseColumns,
            ];
        }
        return baseColumns;
    }, [type]);

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <h2 className="m-0 text-xl font-semibold">{title}</h2>
            <Button 
                label={`Создать новый ключ`}
                icon="pi pi-plus" 
                className="p-button-primary" 
                onClick={handleCreate} 
                style={{backgroundColor: '#6c5dd3', borderColor: '#6c5dd3'}}
            />
        </div>
    );

    return (
        <div className="card">
            {(queryError || deleteMutation.error) && (
                <Message severity="error" text={`Ошибка: ${queryError?.message || deleteMutation.error?.message}`} className="mb-3" />
            )}
            {deleteMutation.isPending && <Message severity="info" text="Удаление..." className="mb-3" />}
            
            <DataTable 
                value={data || []} 
                loading={isLoading}
                paginator rows={10} 
                rowsPerPageOptions={[5, 10, 25]}
                header={header}
                dataKey="key" // Это не уникальный ключ, но для отображения подойдет
                removableSort
                tableStyle={{ minWidth: '70rem' }}
                emptyMessage="Данные кастомизации не найдены."
            >
                {dynamicColumns}
                <Column body={actionBodyTemplate} exportable={false} header="Действия" style={{ minWidth: '150px' }} />
            </DataTable>

            <Dialog 
                visible={openForm} 
                style={{ width: '450px', backgroundColor: '#27293d', color: '#fff' }} 
                header={selectedData ? `Редактировать ключ: ${selectedData.key}` : 'Создать новый ключ кастомизации'} 
                modal 
                className="p-fluid admin-dialog" 
                onHide={handleHideForm}
                closable={false}
            >
                <CustomizationForm 
                    initialData={selectedData} 
                    onClose={handleHideForm} 
                    type={type}
                />
            </Dialog>
            
            <ConfirmDialog />
        </div>
    );
}