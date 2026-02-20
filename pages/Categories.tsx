
import React, { useState } from 'react';
import { useInventoryStore } from '../store';
import { Category } from '../types';
import { ICONS } from '../constants';

const Categories: React.FC = () => {
  const { categories, items, addCategory, deleteCategory } = useInventoryStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      dateCreated: new Date().toISOString()
    };
    addCategory(newCat);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Equipment Categories</h1>
          <p className="text-slate-500">Group and organize your assets</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          {ICONS.Plus} New Category
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => {
          const itemCount = items.filter(i => i.categoryId === cat.id).length;
          return (
            <div key={cat.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-slate-900">{cat.name}</h3>
                  <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-bold">
                    {itemCount} Items
                  </span>
                </div>
                <p className="text-slate-500 text-sm line-clamp-2">{cat.description || 'No description provided.'}</p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
                <p className="text-xs text-slate-400">Created: {new Date(cat.dateCreated).toLocaleDateString()}</p>
                <button 
                  onClick={() => deleteCategory(cat.id)}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                  title="Delete Category"
                >
                  {ICONS.Trash}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add Category</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category Name</label>
                <input required name="name" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="e.g. Tablets, Audio Gear" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea name="description" rows={3} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="What kind of items belong here?" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-600 font-medium">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
