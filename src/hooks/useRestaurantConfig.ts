import { useState, useEffect } from 'react';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { toast } from 'react-toastify';

const client = generateClient<Schema>();

// Use el tipo generado por Amplify para mayor compatibilidad
export interface RestaurantConfig extends Omit<Schema["RestaurantConfig"]["type"], 'createdAt' | 'updatedAt'> {
  // No necesitamos definir propiedades adicionales ya que las heredamos del tipo de Amplify
  // Omitimos createdAt y updatedAt porque son campos autogenerados que no manipulamos directamente
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
        // Preservar valores nulos como undefined para mejor compatibilidad con TypeScript
        setConfig({
          id: restaurantConfig.id,
          salonTables: restaurantConfig.salonTables,
          salonCapacity: restaurantConfig.salonCapacity,
          highTables: restaurantConfig.highTables !== null ? restaurantConfig.highTables : undefined,
          highTablesCapacity: restaurantConfig.highTablesCapacity !== null ? restaurantConfig.highTablesCapacity : undefined,
          terraceTables: restaurantConfig.terraceTables !== null ? restaurantConfig.terraceTables : undefined,
          terraceCapacity: restaurantConfig.terraceCapacity !== null ? restaurantConfig.terraceCapacity : undefined,
          barSeats: restaurantConfig.barSeats !== null ? restaurantConfig.barSeats : undefined,
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

  const saveConfig = async (newConfig: Omit<RestaurantConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setSaving(true);

      if (config && config.id) {
        // Actualizar configuración existente
        // Al actualizar, solo necesitamos especificar el id y los campos que queremos modificar
        // El tipo parcial permite omitir createdAt y updatedAt que son gestionados internamente
        const updateData = {
          id: config.id,
          salonTables: newConfig.salonTables,
          salonCapacity: newConfig.salonCapacity,
          highTables: newConfig.highTables !== undefined ? newConfig.highTables : null,
          highTablesCapacity: newConfig.highTablesCapacity !== undefined ? newConfig.highTablesCapacity : null,
          terraceTables: newConfig.terraceTables !== undefined ? newConfig.terraceTables : null,
          terraceCapacity: newConfig.terraceCapacity !== undefined ? newConfig.terraceCapacity : null,
          barSeats: newConfig.barSeats !== undefined ? newConfig.barSeats : null,
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
        // Para crear una configuración, también usamos null para los campos opcionales en lugar de 0
        const createData = {
          salonTables: newConfig.salonTables,
          salonCapacity: newConfig.salonCapacity,
          highTables: newConfig.highTables !== undefined ? newConfig.highTables : null,
          highTablesCapacity: newConfig.highTablesCapacity !== undefined ? newConfig.highTablesCapacity : null,
          terraceTables: newConfig.terraceTables !== undefined ? newConfig.terraceTables : null,
          terraceCapacity: newConfig.terraceCapacity !== undefined ? newConfig.terraceCapacity : null,
          barSeats: newConfig.barSeats !== undefined ? newConfig.barSeats : null,
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
