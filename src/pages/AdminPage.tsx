import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import EdgesTable from '../components/Admin/EdgesTable';
import './Admin.css';
import BlocksTable from '../components/Admin/BlocksTable';
import TagsTable from '../components/Admin/TagsTable';
import CustomizationTable from '../components/Admin/CustomizationTable';

const navItems = [
    { path: 'edges', name: 'Буровые', icon: 'pi pi-sitemap' },
    { path: 'blocks', name: 'Блоки', icon: 'pi pi-box' },
    { path: 'tags', name: 'Теги', icon: 'pi pi-tags' },
    { path: 'edge-customization', name: 'Компоненты Буровых', icon: 'pi pi-cog' },
    { path: 'block-customization', name: 'Компоненты Блоков', icon: 'pi pi-cog' },
    { path: 'tag-customization', name: 'Компоненты Тегов', icon: 'pi pi-cog' },
    { path: '/', name: 'На Главную', icon: 'pi pi-home', isExternal: true },
];

export default function AdminPage() {
    const location = useLocation();
    const basePath = '/admin'; 

    return (
        <div className="admin-layout"> 
            
            {/* Боковая панель (Sidebar) */}
            <aside className="admin-sidebar">
                {/* Заголовок */}
                <div className="sidebar-header">
                    <i className="pi pi-prime text-3xl text-primary"></i>
                    <h1 className="text-2xl font-bold m-0">Drill</h1>
                </div>
                
                {/* Меню навигации */}
                <nav className="sidebar-nav">
                    <ul className="list-none p-0 m-0">
                        {navItems.map(item => {
                            const isExternal = item.isExternal;
                            const isActive = !isExternal && location.pathname.startsWith(`${basePath}/${item.path}`);
                            const linkClasses = `nav-link ${isActive ? 'active' : ''}`;
                            
                            return (
                                <li key={item.path}>
                                    {isExternal ? (
                                        <a href={item.path} className={linkClasses}>
                                            <i className={item.icon}></i>
                                            <span>{item.name}</span>
                                        </a>
                                    ) : (
                                        <Link to={`${basePath}/${item.path}`} className={linkClasses}>
                                            <i className={item.icon}></i>
                                            <span>{item.name}</span>
                                        </Link>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>
            
            {/* Основной контент */}
            <main className="admin-content">
                <div className="content-header">
                    <h2 className="text-3xl font-semibold">
                       Администрирование
                    </h2>
                </div>
                
                <div className="content-card">
                    <Routes>
                        <Route index element={<Navigate to="edges" replace />} />
                        <Route path="edges" element={<EdgesTable title="Буровые"/>} />
                        <Route path="blocks" element={<BlocksTable title="Блоки"/>} />
                        <Route path="tags" element={<TagsTable title="Теги"/>} />
                        
                        <Route path="edge-customization" element={<CustomizationTable type="edge" title="Компоненты Буровых"/>} />
                        <Route path="block-customization" element={<CustomizationTable type="block" title="Компоненты Блоков"/>} />
                        <Route path="tag-customization" element={<CustomizationTable type="tag" title="Компоненты Тегов"/>} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}