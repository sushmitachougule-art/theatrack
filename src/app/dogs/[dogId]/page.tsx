'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useVaccinationRecords, useVaccinationTypes } from '@/hooks/useVaccinations';
import { getDog, createVaccinationRecord, deleteVaccinationRecord, deleteDog } from '@/lib/repositories';
import { Dog, VaccinationFormData } from '@/types';
import { getVaccinationStatus, formatDate, getDogAge } from '@/lib/utils/dateUtils';
import {
  ArrowLeft, Plus, Syringe, Trash2, CheckCircle, Clock, AlertTriangle,
  FileText, Download, Shield, Phone, X,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

function VaccinationModal({ dogId, ownerId, onClose }: { dogId: string; ownerId: string; onClose: () => void }) {
  const { types } = useVaccinationTypes();
  const [form, setForm] = useState<VaccinationFormData>({
    vaccinationTypeId: '', dateAdministered: '', customIntervalDays: null,
    vetName: '', clinicName: '', batchNumber: '', manufacturer: '',
    sideEffectsNoted: false, sideEffectsNotes: '', cost: null, certificate: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedType = types.find((t) => t.id === form.vaccinationTypeId);
    if (!selectedType) return toast.error('Please select a vaccination type');
    try {
      setSubmitting(true);
      await createVaccinationRecord(dogId, ownerId, form, selectedType.name, selectedType.defaultIntervalDays);
      toast.success('Vaccination record added!');
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Add Vaccination Record</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Vaccination Type *</label>
            <select className="form-select" value={form.vaccinationTypeId} onChange={(e) => setForm((p) => ({ ...p, vaccinationTypeId: e.target.value }))} required>
              <option value="">Select vaccination</option>
              {['core', 'non-core', 'preventive', 'custom'].map((cat) => {
                const catTypes = types.filter((t) => t.category === cat);
                return catTypes.length > 0 ? (
                  <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                    {catTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </optgroup>
                ) : null;
              })}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Date Administered *</label>
              <input type="date" className="form-input" value={form.dateAdministered} onChange={(e) => setForm((p) => ({ ...p, dateAdministered: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Custom Interval (days)</label>
              <input type="number" className="form-input" placeholder="Leave blank for default" value={form.customIntervalDays || ''} onChange={(e) => setForm((p) => ({ ...p, customIntervalDays: e.target.value ? parseInt(e.target.value) : null }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Vet Name</label><input className="form-input" value={form.vetName} onChange={(e) => setForm((p) => ({ ...p, vetName: e.target.value }))} /></div>
            <div><label className="form-label">Clinic Name</label><input className="form-input" value={form.clinicName} onChange={(e) => setForm((p) => ({ ...p, clinicName: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Batch Number</label><input className="form-input" value={form.batchNumber} onChange={(e) => setForm((p) => ({ ...p, batchNumber: e.target.value }))} /></div>
            <div><label className="form-label">Cost (₹)</label><input type="number" className="form-input" value={form.cost || ''} onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value ? parseFloat(e.target.value) : null }))} /></div>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.sideEffectsNoted} onChange={(e) => setForm((p) => ({ ...p, sideEffectsNoted: e.target.checked }))} className="accent-amber-500" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Side effects noted</span>
            </label>
            {form.sideEffectsNoted && (
              <textarea className="form-input mt-2" rows={2} placeholder="Describe side effects..." value={form.sideEffectsNotes} onChange={(e) => setForm((p) => ({ ...p, sideEffectsNotes: e.target.value }))} />
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Saving...' : '💉 Save Record'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DogDetailContent({ params }: { params: Promise<{ dogId: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { records, loading: recsLoading } = useVaccinationRecords(resolvedParams.dogId);

  useEffect(() => {
    getDog(resolvedParams.dogId).then((d) => { setDog(d); setLoading(false); });
  }, [resolvedParams.dogId]);

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Delete this vaccination record?')) return;
    try {
      await deleteVaccinationRecord(id);
      toast.success('Record deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleDeleteDog = async () => {
    if (!confirm(`Are you sure you want to delete ${dog?.name}? This cannot be undone.`)) return;
    try {
      await deleteDog(resolvedParams.dogId);
      toast.success('Dog removed');
      router.push('/dogs');
    } catch { toast.error('Failed to delete'); }
  };

  const handleExportPDF = () => {
    if (!dog) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(`Vaccination Record: ${dog.name}`, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Breed: ${dog.breed} | Age: ${getDogAge(dog.dateOfBirth)} | Gender: ${dog.gender}`, 14, 30);
    if (dog.microchipNumber) doc.text(`Microchip: ${dog.microchipNumber}`, 14, 36);

    // Table
    const tableData = records.map(r => [
      r.vaccinationTypeName,
      formatDate(r.dateAdministered),
      formatDate(r.nextDueDate),
      r.vetName || 'N/A',
      r.status
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Vaccine', 'Date Given', 'Next Due', 'Vet/Clinic', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] }
    });

    doc.save(`${dog.name}-vaccinations.pdf`);
    toast.success('PDF Exported!');
  };

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  if (!dog) return <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>Dog not found</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/dogs" className="flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} /> Back to My Dogs
      </Link>

      {/* Profile card */}
      <div className="glass-card p-6" style={{ cursor: 'default' }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
            style={{ background: 'rgba(245,158,11,0.15)' }}>
            {dog.photoUrl ? <Image src={dog.photoUrl} alt={dog.name} width={64} height={64} className="w-full h-full rounded-xl object-cover" /> : '🐕'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{dog.name}</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {dog.breed} · {getDogAge(dog.dateOfBirth)} · {dog.gender === 'male' ? '♂ Male' : '♀ Female'}
              {dog.weight ? ` · ${dog.weight}kg` : ''}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={handleExportPDF} className="btn-secondary flex items-center justify-center gap-2 text-sm px-3 py-2">
              <Download size={14} /> Export PDF
            </button>
            <button onClick={handleDeleteDog} className="btn-danger flex items-center justify-center gap-2 text-sm px-3 py-2">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap gap-2 text-xs">
          {dog.microchipNumber && (
            <span className="px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <Shield size={12} /> Microchip: {dog.microchipNumber}
            </span>
          )}
          {dog.emergencyVetPhone && (
            <span className="px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <Phone size={12} /> Emergency: {dog.emergencyVetName} ({dog.emergencyVetPhone})
            </span>
          )}
          {dog.insuranceProvider && (
            <span className="px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <FileText size={12} /> Insurance: {dog.insuranceProvider}
            </span>
          )}
        </div>
      </div>

      {/* Vaccination records */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Vaccination Records</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14} /> Add Record
          </button>
        </div>

        {recsLoading ? (
          <div className="flex justify-center py-8"><div className="spinner" /></div>
        ) : records.length === 0 ? (
          <div className="glass-card p-8 text-center" style={{ cursor: 'default' }}>
            <Syringe size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>No vaccination records yet</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Add the first vaccination to start tracking schedules.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2 text-sm">
              <Plus size={14} /> Add First Record
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((r) => {
              const info = getVaccinationStatus(r.nextDueDate);
              return (
                <div key={r.id} className="glass-card p-4" style={{ cursor: 'default' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
                        style={{ background: 'rgba(245,158,11,0.15)' }}>
                        <Syringe size={16} style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{r.vaccinationTypeName}</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Given: {formatDate(r.dateAdministered)}
                          {r.vetName ? ` · Dr. ${r.vetName}` : ''}
                          {r.clinicName ? ` at ${r.clinicName}` : ''}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          Next due: {formatDate(r.nextDueDate)}
                        </p>
                        {r.cost && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Cost: ₹{r.cost}</p>}
                        {r.sideEffectsNoted && (
                          <p className="text-xs mt-1 px-2 py-1 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                            ⚠️ Side effects: {r.sideEffectsNotes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`status-${info.status} px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1`}>
                        {info.status === 'green' && <CheckCircle size={11} />}
                        {info.status === 'yellow' && <Clock size={11} />}
                        {info.status === 'red' && <AlertTriangle size={11} />}
                        {info.label}
                      </span>
                      <button onClick={() => handleDeleteRecord(r.id)} className="p-1 rounded hover:bg-red-500/10" style={{ color: 'var(--text-muted)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && user && (
        <VaccinationModal dogId={resolvedParams.dogId} ownerId={user.uid} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export default function DogDetailPage({ params }: { params: Promise<{ dogId: string }> }) {
  return <AppLayout><DogDetailContent params={params} /></AppLayout>;
}
