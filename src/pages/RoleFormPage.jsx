import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, CheckSquare, Square, MinusSquare } from 'lucide-react';
import API from '../api';

export default function RoleFormPage() {
  const { id } = useParams();;
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [roleName, setRoleName] = useState('');
  const [status, setStatus] = useState(1);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const actions = ['read','create','update','delete'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 🔥 GET PERMISSIONS BY VALUE
        const permRes = await API.get('/permissions');

        const permValues = permRes.data
          .map(p => p.value)
          .filter(Boolean);

        const uniqueResources = [
          ...new Set(permValues.map(v => v.split('_')[0]))
        ];

        setResources(uniqueResources.sort());

        // 🔥 EDIT MODE
        if (isEditMode) {
          const roleRes = await API.get(`/roles/${id}`);
          const role = roleRes.data;

          setRoleName(role.name || '');
          setStatus(role.status ?? 1);

          // ✅ DB ALREADY STORES STRINGS
          setSelectedPermissions(role.permissions || []);
        }

      } catch(err){
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  },[id,isEditMode]);

  const togglePermission = (resource,action)=>{
    const slug = `${resource}_${action}`;

    setSelectedPermissions(prev =>
      prev.includes(slug)
        ? prev.filter(p => p!==slug)
        : [...prev,slug]
    );
  };

  const toggleRow = (resource)=>{
    const rowPerms = actions.map(a => `${resource}_${a}`);
    const allSelected = rowPerms.every(p =>
      selectedPermissions.includes(p)
    );

    setSelectedPermissions(prev =>
      allSelected
        ? prev.filter(p=>!rowPerms.includes(p))
        : [...new Set([...prev,...rowPerms])]
    );
  };

  const handleSave = async ()=>{
    if(!roleName.trim()){
      alert("Role Name required");
      return;
    }

    setSaving(true);

    try{
      const payload = {
        name: roleName,
        status,
        permissions: selectedPermissions // ✅ send values
      };

      if(isEditMode)
        await API.put(`/roles/${id}`,payload);
      else
        await API.post('/roles',payload);

      navigate('/admin/roles');

    }catch(err){
      alert(err.response?.data?.message || "Save failed");
    }finally{
      setSaving(false);
    }
  };

  const getRowStatus=(resource)=>{
    const rowPerms = actions.map(a => `${resource}_${a}`);
    const count = rowPerms.filter(p =>
      selectedPermissions.includes(p)
    ).length;

    if(count===4) return 'checked';
    if(count>0) return 'indeterminate';
    return 'unchecked';
  };

  if(loading)
    return <div className="p-10 text-center">Loading...</div>;

  return(
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto">

        <div className="flex justify-between mb-4">
          <button onClick={()=>navigate('/admin/roles')}>
            <ArrowLeft/>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded"
          >
            <Save/> {saving?'Saving...':'Save'}
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-6">
          {isEditMode?'Edit Role':'Create Role'}
        </h1>

        <input
          value={roleName}
          onChange={e=>setRoleName(e.target.value)}
          placeholder="Role name"
          className="w-full p-4 border rounded mb-6"
        />

        <table className="w-full border">
          <thead>
            <tr>
              <th>Feature</th>
              <th>All</th>
              {actions.map(a=>(
                <th key={a}>{a}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {resources.map(res=>{
              const rowStatus = getRowStatus(res);

              return(
                <tr key={res}>
                  <td>{res}</td>

                  <td>
                    <button onClick={()=>toggleRow(res)}>
                      {rowStatus==='checked' && <CheckSquare/>}
                      {rowStatus==='indeterminate' && <MinusSquare/>}
                      {rowStatus==='unchecked' && <Square/>}
                    </button>
                  </td>

                  {actions.map(a=>{
                    const slug = `${res}_${a}`;
                    return(
                      <td key={a}>
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(slug)}
                          onChange={()=>togglePermission(res,a)}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

      </div>
    </div>
  );
}