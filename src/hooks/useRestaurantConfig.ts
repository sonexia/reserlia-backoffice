import { useState, useEffect } from 'react';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { toast } from 'react-toastify';

const client = generateClient<Schema>();

// Use el tipo generado por Amplify para mayor compatibilidad
export interface RestaurantConfig extends Omit<Schema["RestaurantConfig"]["type"], 'createdAt' | 'updatedAt'> {
  // Campo externo establecido por otro flujo (puede no existir en el esquema de Amplify)
  assignedPhoneNumber?: string;
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
        
        // Additional null check for restaurantConfig itself
        if (!restaurantConfig || !restaurantConfig.id) {
          console.warn('Restaurant config is malformed or missing id:', restaurantConfig);
          setConfig(null);
          return;
        }
        
        // Preservar valores nulos como undefined para mejor compatibilidad con TypeScript
        setConfig({
          id: restaurantConfig.id,
          businessName: restaurantConfig.businessName || '', // Handle missing businessName for backward compatibility
          salonTables: restaurantConfig.salonTables,
          salonCapacity: restaurantConfig.salonCapacity,
          highTables: restaurantConfig.highTables !== null ? restaurantConfig.highTables : undefined,
          highTablesCapacity: restaurantConfig.highTablesCapacity !== null ? restaurantConfig.highTablesCapacity : undefined,
          terraceTables: restaurantConfig.terraceTables !== null ? restaurantConfig.terraceTables : undefined,
          terraceCapacity: restaurantConfig.terraceCapacity !== null ? restaurantConfig.terraceCapacity : undefined,
          barSeats: restaurantConfig.barSeats !== null ? restaurantConfig.barSeats : undefined,
          // Configuración avanzada
          requiresDeposit: restaurantConfig.requiresDeposit !== null ? restaurantConfig.requiresDeposit : undefined,
          depositType: restaurantConfig.depositType || undefined,
          depositAmount: restaurantConfig.depositAmount !== null ? restaurantConfig.depositAmount : undefined,
          askReservationReason: restaurantConfig.askReservationReason !== null ? restaurantConfig.askReservationReason : undefined,
          askAllergies: restaurantConfig.askAllergies !== null ? restaurantConfig.askAllergies : undefined,
          askFoodType: restaurantConfig.askFoodType !== null ? restaurantConfig.askFoodType : undefined,
          // Horarios y configuración del bot
          reservationSchedule: restaurantConfig.reservationSchedule ? JSON.parse(restaurantConfig.reservationSchedule as string) : undefined,
          callRedirectionSchedule: restaurantConfig.callRedirectionSchedule ? JSON.parse(restaurantConfig.callRedirectionSchedule as string) : undefined,
          maxDinersPerBot: restaurantConfig.maxDinersPerBot !== null ? restaurantConfig.maxDinersPerBot : undefined,
          reservationDuration: restaurantConfig.reservationDuration !== null ? restaurantConfig.reservationDuration : undefined,
          timezone: restaurantConfig.timezone || 'Europe/Madrid',
          // Configuración de margen de reserva
          minTimeForReservations: restaurantConfig.minTimeForReservations !== null ? restaurantConfig.minTimeForReservations : undefined,
          actionDuringReservationGracePeriod: restaurantConfig.actionDuringReservationGracePeriod || undefined,
          // Suscripción
          subscriptionStatus: restaurantConfig.subscriptionStatus ?? undefined,
          stripeCustomerId: restaurantConfig.stripeCustomerId ?? undefined,
          stripeSubscriptionId: restaurantConfig.stripeSubscriptionId ?? undefined,
          // Campo externo opcional (puede no venir tipeado en Schema). Accedemos con aserción tipada.
          assignedPhoneNumber: (restaurantConfig as { assignedPhoneNumber?: string }).assignedPhoneNumber ?? undefined,
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
          businessName: newConfig.businessName,
          salonTables: newConfig.salonTables,
          salonCapacity: newConfig.salonCapacity,
          highTables: newConfig.highTables !== undefined ? newConfig.highTables : null,
          highTablesCapacity: newConfig.highTablesCapacity !== undefined ? newConfig.highTablesCapacity : null,
          terraceTables: newConfig.terraceTables !== undefined ? newConfig.terraceTables : null,
          terraceCapacity: newConfig.terraceCapacity !== undefined ? newConfig.terraceCapacity : null,
          barSeats: newConfig.barSeats !== undefined ? newConfig.barSeats : null,
          // Configuración avanzada
          requiresDeposit: newConfig.requiresDeposit !== undefined ? newConfig.requiresDeposit : null,
          depositType: newConfig.depositType !== undefined ? newConfig.depositType : null,
          depositAmount: newConfig.depositAmount !== undefined ? newConfig.depositAmount : null,
          askReservationReason: newConfig.askReservationReason !== undefined ? newConfig.askReservationReason : null,
          askAllergies: newConfig.askAllergies !== undefined ? newConfig.askAllergies : null,
          askFoodType: newConfig.askFoodType !== undefined ? newConfig.askFoodType : null,
          // Horarios y configuración del bot
          reservationSchedule: newConfig.reservationSchedule ? JSON.stringify(newConfig.reservationSchedule) : null,
          callRedirectionSchedule: newConfig.callRedirectionSchedule ? JSON.stringify(newConfig.callRedirectionSchedule) : null,
          maxDinersPerBot: newConfig.maxDinersPerBot !== undefined ? newConfig.maxDinersPerBot : null,
          reservationDuration: newConfig.reservationDuration !== undefined ? newConfig.reservationDuration : null,
          timezone: newConfig.timezone || 'Europe/Madrid',
          // Configuración de margen de reserva
          minTimeForReservations: newConfig.minTimeForReservations !== undefined ? newConfig.minTimeForReservations : null,
          actionDuringReservationGracePeriod: newConfig.actionDuringReservationGracePeriod !== undefined ? newConfig.actionDuringReservationGracePeriod : null,
          // Suscripción
          subscriptionStatus: newConfig.subscriptionStatus !== undefined ? newConfig.subscriptionStatus : null,
          stripeCustomerId: newConfig.stripeCustomerId !== undefined ? newConfig.stripeCustomerId : null,
          stripeSubscriptionId: newConfig.stripeSubscriptionId !== undefined ? newConfig.stripeSubscriptionId : null,
        };

        const { data } = await client.models.RestaurantConfig.update(updateData);
        
        if (data) {
          setConfig({
            id: data.id,
            businessName: data.businessName,
            salonTables: data.salonTables,
            salonCapacity: data.salonCapacity,
            highTables: data.highTables || 0,
            highTablesCapacity: data.highTablesCapacity || 0,
            terraceTables: data.terraceTables || 0,
            terraceCapacity: data.terraceCapacity || 0,
            barSeats: data.barSeats || 0,
            // Configuración avanzada
            requiresDeposit: data.requiresDeposit || false,
            depositType: data.depositType || 'FIXED_PER_RESERVATION',
            depositAmount: data.depositAmount || undefined,
            askReservationReason: data.askReservationReason || false,
            askAllergies: data.askAllergies || false,
            askFoodType: data.askFoodType || false,
            // Horarios y configuración del bot
            reservationSchedule: data.reservationSchedule ? JSON.parse(data.reservationSchedule as string) : undefined,
            callRedirectionSchedule: data.callRedirectionSchedule ? JSON.parse(data.callRedirectionSchedule as string) : undefined,
            maxDinersPerBot: data.maxDinersPerBot || 6,
            reservationDuration: data.reservationDuration || 120,
            timezone: data.timezone || 'Europe/Madrid',
            // Configuración de margen de reserva
            minTimeForReservations: data.minTimeForReservations !== null ? data.minTimeForReservations : undefined,
            actionDuringReservationGracePeriod: data.actionDuringReservationGracePeriod || undefined,
            // Suscripción
            subscriptionStatus: data.subscriptionStatus || 'none',
            stripeCustomerId: data.stripeCustomerId || undefined,
            stripeSubscriptionId: data.stripeSubscriptionId || undefined,
          });
          toast.success('Configuración actualizada correctamente');
        }
      } else {
        // Crear nueva configuración
        // Para crear una configuración, también usamos null para los campos opcionales en lugar de 0
        const createData = {
          businessName: newConfig.businessName,
          salonTables: newConfig.salonTables,
          salonCapacity: newConfig.salonCapacity,
          highTables: newConfig.highTables !== undefined ? newConfig.highTables : null,
          highTablesCapacity: newConfig.highTablesCapacity !== undefined ? newConfig.highTablesCapacity : null,
          terraceTables: newConfig.terraceTables !== undefined ? newConfig.terraceTables : null,
          terraceCapacity: newConfig.terraceCapacity !== undefined ? newConfig.terraceCapacity : null,
          barSeats: newConfig.barSeats !== undefined ? newConfig.barSeats : null,
          // Configuración avanzada
          requiresDeposit: newConfig.requiresDeposit !== undefined ? newConfig.requiresDeposit : null,
          depositType: newConfig.depositType || null,
          depositAmount: newConfig.depositAmount !== undefined ? newConfig.depositAmount : null,
          askReservationReason: newConfig.askReservationReason !== undefined ? newConfig.askReservationReason : null,
          askAllergies: newConfig.askAllergies !== undefined ? newConfig.askAllergies : null,
          askFoodType: newConfig.askFoodType !== undefined ? newConfig.askFoodType : null,
          // Horarios y configuración del bot
          reservationSchedule: newConfig.reservationSchedule ? JSON.stringify(newConfig.reservationSchedule) : null,
          callRedirectionSchedule: newConfig.callRedirectionSchedule ? JSON.stringify(newConfig.callRedirectionSchedule) : null,
          maxDinersPerBot: newConfig.maxDinersPerBot !== undefined ? newConfig.maxDinersPerBot : null,
          reservationDuration: newConfig.reservationDuration !== undefined ? newConfig.reservationDuration : null,
          timezone: newConfig.timezone || 'Europe/Madrid',
          // Configuración de margen de reserva
          minTimeForReservations: newConfig.minTimeForReservations !== undefined ? newConfig.minTimeForReservations : null,
          actionDuringReservationGracePeriod: newConfig.actionDuringReservationGracePeriod !== undefined ? newConfig.actionDuringReservationGracePeriod : null,
          // Suscripción
          subscriptionStatus: newConfig.subscriptionStatus !== undefined ? newConfig.subscriptionStatus : null,
          stripeCustomerId: newConfig.stripeCustomerId !== undefined ? newConfig.stripeCustomerId : null,
          stripeSubscriptionId: newConfig.stripeSubscriptionId !== undefined ? newConfig.stripeSubscriptionId : null,
        };

        const { data } = await client.models.RestaurantConfig.create(createData);
        
        if (data) {
          setConfig({
            id: data.id,
            businessName: data.businessName,
            salonTables: data.salonTables,
            salonCapacity: data.salonCapacity,
            highTables: data.highTables || 0,
            highTablesCapacity: data.highTablesCapacity || 0,
            terraceTables: data.terraceTables || 0,
            terraceCapacity: data.terraceCapacity || 0,
            barSeats: data.barSeats || 0,
            // Configuración avanzada
            requiresDeposit: data.requiresDeposit || false,
            depositType: data.depositType || 'FIXED_PER_RESERVATION',
            depositAmount: data.depositAmount || undefined,
            askReservationReason: data.askReservationReason || false,
            askAllergies: data.askAllergies || false,
            askFoodType: data.askFoodType || false,
            // Configuración de margen de reserva
            minTimeForReservations: data.minTimeForReservations !== null ? data.minTimeForReservations : undefined,
            actionDuringReservationGracePeriod: data.actionDuringReservationGracePeriod || undefined,
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
