import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { BUSINESS_TYPES, BusinessFeature, BusinessTypeConfig, BusinessTypeId, isBusinessTypeId } from '../config/businessTypes';

interface BusinessContextType {
  /** null hasta que la empresa elija su tipo. */
  businessType: BusinessTypeId | null;
  config: BusinessTypeConfig;
  isLoading: boolean;
  hasFeature: (feature: BusinessFeature) => boolean;
  setBusinessType: (id: BusinessTypeId) => void;
}

const BusinessContext = createContext<BusinessContextType | null>(null);

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness debe usarse dentro de BusinessProvider');
  return context;
};

const getCacheKey = (companyId: string) => `schopy_business_type_${companyId}`;

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { companyId } = useAuth();
  const [businessType, setType] = useState<BusinessTypeId | null>(null);
  const [loadedCompanyId, setLoadedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      setType(null);
      setLoadedCompanyId(null);
      return;
    }

    const cached = localStorage.getItem(getCacheKey(companyId));
    if (isBusinessTypeId(cached)) {
      setType(cached);
      setLoadedCompanyId(companyId);
    } else {
      setType(null);
    }

    return onSnapshot(doc(db, 'companies', companyId), { includeMetadataChanges: true }, (snapshot) => {
      const remote = snapshot.data()?.businessType;
      if (isBusinessTypeId(remote)) {
        setType(remote);
        localStorage.setItem(getCacheKey(companyId), remote);
      }
      // Tras reinstalar, la caché vacía no prueba nada: hay que esperar al servidor
      // para no volver a preguntar a una empresa que ya eligió.
      if (snapshot.exists() || !snapshot.metadata.fromCache || !navigator.onLine) {
        setLoadedCompanyId(companyId);
      }
    }, (error) => {
      console.error('Error cargando el tipo de negocio:', error);
      setLoadedCompanyId(companyId);
    });
  }, [companyId]);

  const setBusinessType = useCallback((id: BusinessTypeId) => {
    if (!companyId) return;
    setType(id);
    localStorage.setItem(getCacheKey(companyId), id);
    setDoc(doc(db, 'companies', companyId), { businessType: id }, { merge: true })
      .catch(error => console.error('Error guardando el tipo de negocio:', error));
  }, [companyId]);

  const value = useMemo<BusinessContextType>(() => {
    const config = BUSINESS_TYPES[businessType ?? 'general'];
    return {
      businessType,
      config,
      isLoading: Boolean(companyId) && loadedCompanyId !== companyId,
      hasFeature: feature => config.features.includes(feature),
      setBusinessType,
    };
  }, [businessType, companyId, loadedCompanyId, setBusinessType]);

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
};
