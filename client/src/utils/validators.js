export const validateTransportRequest = (formData) => {
  const errors = {};

  if (!formData.department?.trim()) {
    errors.department = 'Department is required';
  }

  if (!formData.designation?.trim()) {
    errors.designation = 'Designation is required';
  }

  if (!formData.date_of_visit) {
    errors.date_of_visit = 'Date of visit is required';
  }

  if (!formData.time_of_visit) {
    errors.time_of_visit = 'Time of visit is required';
  }

  if (!formData.place_of_visit?.trim()) {
    errors.place_of_visit = 'Place of visit is required';
  }

  if (!formData.purpose?.trim()) {
    errors.purpose = 'Purpose is required';
  }

  if (!formData.number_of_persons || formData.number_of_persons < 1) {
    errors.number_of_persons = 'Number of persons must be at least 1';
  }

  if (!formData.head_id && !formData.custom_head_email) {
    errors.head = 'Please select a head or enter custom email';
  }

  if (formData.custom_head_email && !isValidEmail(formData.custom_head_email)) {
    errors.custom_head_email = 'Invalid email format';
  }

  return errors;
};

export const validateTravelDetails = (formData) => {
  const errors = {};

  if (!formData.vehicle_number?.trim()) {
    errors.vehicle_number = 'Vehicle number is required';
  }

  if (!formData.driver_name?.trim()) {
    errors.driver_name = 'Driver name is required';
  }

  if (!formData.opening_meter) {
    errors.opening_meter = 'Opening meter reading is required';
  }

  if (!formData.closing_meter) {
    errors.closing_meter = 'Closing meter reading is required';
  }

  if (formData.opening_meter && formData.closing_meter) {
    if (parseFloat(formData.closing_meter) <= parseFloat(formData.opening_meter)) {
      errors.closing_meter = 'Closing meter must be greater than opening meter';
    }
  }

  if (!formData.rate_per_km) {
    errors.rate_per_km = 'Rate per KM is required';
  }

  if (!formData.vehicle_type) {
    errors.vehicle_type = 'Vehicle type is required';
  }

  return errors;
};

export const validateVehicle = (formData) => {
  const errors = {};

  if (!formData.vehicle_number?.trim()) {
    errors.vehicle_number = 'Vehicle number is required';
  }

  if (!formData.vehicle_type) {
    errors.vehicle_type = 'Vehicle type is required';
  }

  if (!formData.capacity || formData.capacity < 1) {
    errors.capacity = 'Capacity must be at least 1';
  }

  return errors;
};

export const validateRateSettings = (formData) => {
  const errors = {};

  if (!formData.diesel_car_rate || formData.diesel_car_rate <= 0) {
    errors.diesel_car_rate = 'Diesel car rate must be greater than 0';
  }

  if (!formData.petrol_car_rate || formData.petrol_car_rate <= 0) {
    errors.petrol_car_rate = 'Petrol car rate must be greater than 0';
  }

  if (!formData.bus_student_rate || formData.bus_student_rate <= 0) {
    errors.bus_student_rate = 'Bus student rate must be greater than 0';
  }

  if (!formData.bus_other_rate || formData.bus_other_rate <= 0) {
    errors.bus_other_rate = 'Bus other rate must be greater than 0';
  }

  if (!formData.night_charge || formData.night_charge < 0) {
    errors.night_charge = 'Night charge cannot be negative';
  }

  return errors;
};

const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};