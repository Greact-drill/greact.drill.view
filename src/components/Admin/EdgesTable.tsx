// src/components/Admin/EdgesTable.tsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEdgesForAdmin, deleteEdge, createEdge, updateEdge } from '../../api/admin'; 
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';

interface Edge {
    id: string;
    name: string;
}

interface Props {
    title: string;
}

// --- КОМПОНЕНТ ФОРМЫ (Создание/Редактирование) ---
const EdgeForm: React.FC<{ edge?: Edge | null; onClose: () => void; isSubmitting: boolean }> = ({ 
    edge, 
    onClose, 
    isSubmitting
}) => {
    const queryClient = useQueryClient();
    const isEdit = !!edge;
    const [name, setName] = useState(edge?.name || '');
    const [id, setId] = useState(edge?.id || '');
    const [error, setError] = useState('');

    const mutation = useMutation({
        mutationFn: (data: Partial<Edge>) => 
            isEdit ? updateEdge(edge!.id, data) : createEdge({ id: id, name: name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['edges'] });
            onClose();
        },
        onError: (err: any) => {
            setError(err.message || 'Ошибка выполнения операции.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name || (!isEdit && !id)) {
            setError('ID и Название не могут быть пустыми.');
            return;
        }
        
        const payload: Partial<Edge> = { name };
        if (!isEdit) {
            payload.id = id;
        }

        mutation.mutate(payload);
    };
    
    // Стили для соответствия новой теме
    const inputStyle = { backgroundColor: '#1e1e2f', borderColor: '#3a3c53' };
    const labelStyle = { color: '#a0a2b8' };

    return (
        <form onSubmit={handleSubmit} className="p-fluid">
            {error && <Message severity="error" text={error} className="mb-3" />}
            
            <div className="field">
                <label htmlFor="id" className="font-semibold mb-2 block" style={labelStyle}>ID (Ключ)</label>
                <InputText 
                    id="id" 
                    value={id} 
                    onChange={(e) => setId(e.target.value)} 
                    disabled={isEdit || mutation.isPending} 
                    required 
                    style={inputStyle}
                />
            </div>
            
            <div className="field mt-3">
                <label htmlFor="name" className="font-semibold mb-2 block" style={labelStyle}>Название</label>
                <InputText 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    disabled={mutation.isPending}
                    style={inputStyle}
                />
            </div>

            <div className="flex justify-content-center gap-4 edge-form-footer"> 
                <Button 
                    icon="pi pi-check" // Галочка
                    type="submit" 
                    loading={mutation.isPending} 
                    tooltip={isEdit ? 'Сохранить' : 'Создать'} // Всплывающая подсказка
                    className="p-button-rounded" /* Делаем круглой/квадратной */
                    style={{backgroundColor: '#6c5dd3', borderColor: '#6c5dd3', width: '2.5rem', height: '2.5rem', padding: '0'}} 
                />
                <Button 
                    icon="pi pi-times" // Крестик
                    onClick={onClose} 
                    className="p-button-danger p-button-rounded" /* Делаем красной и круглой/квадратной */
                    disabled={mutation.isPending} 
                    tooltip="Отмена" // Добавим всплывающую подсказку вместо текста
                    style={{width: '2.5rem', height: '2.5rem', padding: '0'}} /* Указываем фиксированный размер для квадрата */
                />
            </div>
        </form>
    );
};

// --- ОСНОВНОЙ КОМПОНЕНТ ТАБЛИЦЫ ---

export default function EdgesTable({title} : Props) {
    const queryClient = useQueryClient();
    const [openForm, setOpenForm] = useState(false);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
    const [deleteError, setDeleteError] = useState('');

    const { data: edges, isLoading, error } = useQuery<Edge[]>({
        queryKey: ['edges'],
        queryFn: getEdgesForAdmin,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteEdge,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['edges'] });
            setDeleteError('');
        },
        onError: (err: any) => {
            setDeleteError(err.message || 'Не удалось удалить буровую.');
        }
    });

    const handleEdit = (edge: Edge) => {
        setSelectedEdge(edge);
        setOpenForm(true);
    };

    const handleCreate = () => {
        setSelectedEdge(null);
        setOpenForm(true);
    };

    const handleHideForm = () => {
        setOpenForm(false);
        setSelectedEdge(null);
    };

    const handleDelete = (id: string) => {
        setDeleteError('');
        confirmDialog({
            message: `Вы уверены, что хотите удалить буровую с ID: ${id}?`,
            header: 'Подтверждение удаления',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => deleteMutation.mutate(id),
        });
    };

    const actionBodyTemplate = (rowData: Edge) => {
        return (
            <div className="flex gap-2">
                <Button 
                    icon="pi pi-pencil" 
                    className="p-button-rounded p-button-text text-primary"
                    onClick={() => handleEdit(rowData)} 
                    tooltip="Редактировать" 
                />
                <Button 
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-text p-button-danger"
                    onClick={() => handleDelete(rowData.id)} 
                    tooltip="Удалить" 
                    loading={deleteMutation.isPending && deleteMutation.variables === rowData.id}
                />
            </div>
        );
    };

    const header = (
        <div className="flex justify-content-end">
            <h2 className="m-0 text-xl font-semibold">{title}</h2>
            <Button 
                label="Создать буровую" 
                icon="pi pi-plus" 
                onClick={handleCreate} 
                style={{backgroundColor: '#6c5dd3', borderColor: '#6c5dd3'}}
            />
        </div>
    );
    
    if (error) {
        return <Message severity="error" text={`Ошибка загрузки данных: ${error.message}`} />;
    }
    
    return (
        <div>
            {deleteError && <Message severity="error" text={deleteError} className="mb-3" />}
            
            <DataTable 
                value={edges || []} 
                loading={isLoading}
                paginator rows={10} 
                rowsPerPageOptions={[5, 10, 25]}
                header={header}
                dataKey="id"
                removableSort
                tableStyle={{ minWidth: '50rem' }}
                emptyMessage="Буровые не найдены."
            >
                <Column field="id" header="ID (Ключ)" sortable style={{ width: '25%' }} />
                <Column field="name" header="Название буровой" sortable style={{ width: '50%' }} />
                <Column body={actionBodyTemplate} exportable={false} header="Действия" style={{ minWidth: '150px' }} />
            </DataTable>

            <Dialog 
                visible={openForm}
                style={{ width: '450px', backgroundColor: '#27293d', color: '#fff' }}
                header={selectedEdge ? `Редактировать: ${selectedEdge.id}` : 'Создать новую буровую'}
                modal
                className="p-fluid admin-dialog"
                onHide={handleHideForm}
                closable={false}
            >
            <EdgeForm 
                edge={selectedEdge}
                onClose={handleHideForm}
                isSubmitting={deleteMutation.isPending}
            />
            </Dialog>
            
            <ConfirmDialog />
        </div>
    );
}