import { useState, useEffect } from 'react';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { toast } from 'react-toastify';

const client = generateClient<Schema>();

export interface RestaurantConfig {
  id?: string;
  salonTables: number;
  salonCapacity: number;
  highTables?: number;
  highTablesCapacity?: number;
  terraceTables?: number;
  terraceCapacity?: number;
  barSeats?: number;
}

export const useRestaurantConfig = () => {
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar la configuración al inicializar el hook
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data: configs } = await client.models.RestaurantConfig.list();
      
      // Debería haber solo una configuración por usuario
      if (configs && configs.length > 0) {
        const restaurantConfig = configs[0];
        setConfig({
          id: restaurantConfig.id,
          salonTables: restaurantConfig.salonTables,
          salonCapacity: restaurantConfig.salonCapacity,
          highTables: restaurantConfig.highTables || 0,
          highTablesCapacity: restaurantConfig.highTablesCapacity || 0,
          terraceTables: restaurantConfig.terraceTables || 0,
          terraceCapacity: restaurantConfig.terraceCapacity || 0,
          barSeats: restaurantConfig.barSeats || 0,
        });
      } else {
        setConfig(null);
      }
    } catch (error) {
      console.error('Error loading restaurant config:', error);
      toast.error('Error al cargar la configuración del restaurante');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: Omit<RestaurantConfig, 'id'>) => {
    try {
      setSaving(true);

      if (config && config.id) {
        // Actualizar configuración existente
        const updateData = {
          id: config.id,
          salonTables: newConfig.salonTables,
          salonCapacity: newConfig.salonCapacity,
          highTables: newConfig.highTables || 0,
          highTablesCapacity: newConfig.highTablesCapacity || 0,
          terraceTables: newConfig.terraceTables || 0,
          terraceCapacity: newConfig.terraceCapacity || 0,
          barSeats: newConfig.barSeats || 0,
        };

        const { data } = await client.models.RestaurantConfig.update(updateData);
        
        if (data) {
          setConfig({
            id: data.id,
            salonTables: data.salonTables,
            salonCapacity: data.salonCapacity,
            highTables: data.highTables || 0,
            highTablesCapacity: data.highTablesCapacity || 0,
            terraceTables: data.terraceTables || 0,
            terraceCapacity: data.terraceCapacity || 0,
            barSeats: data.barSeats || 0,
          });
          toast.success('Configuración actualizada correctamente');
        }
      } else {
        // Crear nueva configuración
        const createData = {
          salonTables: newConfig.salonTables,
          salonCapacity: newConfig.salonCapacity,
          highTables: newConfig.highTables || 0,
          highTablesCapacity: newConfig.highTablesCapacity || 0,
          terraceTables: newConfig.terraceTables || 0,
          terraceCapacity: newConfig.terraceCapacity || 0,
          barSeats: newConfig.barSeats || 0,
        };

        const { data } = await client.models.RestaurantConfig.create(createData);
        
        if (data) {
          setConfig({
            id: data.id,
            salonTables: data.salonTables,
            salonCapacity: data.salonCapacity,
            highTables: data.highTables || 0,
            highTablesCapacity: data.highTablesCapacity || 0,
            terraceTables: data.terraceTables || 0,
            terraceCapacity: data.terraceCapacity || 0,
            barSeats: data.barSeats || 0,
          });
          toast.success('Configuración guardada correctamente');
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving restaurant config:', error);
      toast.error('Error al guardar la configuración. Por favor intenta de nuevo.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const isFirstTimeSetup = () => {
    return !loading && config === null;
  };

  return {
    config,
    loading,
    saving,
    saveConfig,
    loadConfig,
    isFirstTimeSetup,
  };
};
