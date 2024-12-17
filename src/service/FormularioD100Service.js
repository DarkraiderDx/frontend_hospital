import HttpClientApi from "./HttpClientApi";

export default {
    filterData: (months = [], genders = [], services = [], doctors = [], years = [],requests=[],pacient=[]) => {
        let url = 'd100/?';
   
        // Agregar parámetros de meses
        if (months.length > 0) {
            url += months.map(m => `mes=${encodeURIComponent(m.name)}`).join('&') + '&';
        }
   
        // Agregar parámetros de géneros
        if (genders.length > 0) {
            url += genders.map(g => `sexo=${encodeURIComponent(g.name)}`).join('&') + '&';
        }
   
        // Agregar parámetros de servicios
        if (services.length > 0) {
            url += services.map(s => `servicio=${encodeURIComponent(s.name)}`).join('&') + '&';
        }
   
        // Agregar parámetros de doctores
        if (doctors.length > 0) {
            url += doctors.map(d => `medico=${encodeURIComponent(d.name)}`).join('&') + '&';
        }
   
        // Agregar parámetros de años
        if (years.length > 0) {
            url += years.map(y => `año=${encodeURIComponent(y.name)}`).join('&') + '&';
        }
        if (requests.length > 0){
            url += requests.map(s => `solicitud=${encodeURIComponent(s.name)}`).join('&')+'&';
        }
        if (pacient.length > 0){
            url += pacient.map(s => `paciente=${encodeURIComponent(s.name)}`).join('&')+'&';
        }
        // Eliminar el último '&' sobrante si existe
        url = url.endsWith('&') ? url.slice(0, -1) : url;
        return HttpClientApi().get(url);
    },
    
    
};
