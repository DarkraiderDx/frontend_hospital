<template>
    <div class="card">
        <div v-if="loading" class="overlay"></div>
        <Dialog v-model:visible="loading" header="Cargando" :closable="false" style="width: 300px;" :modal="true">
            <div class="loading-content">
                <i class="pi pi-spinner pi-spin" style="font-size: 2rem;"></i>
                <p>Cargando datos...</p>
            </div>
        </Dialog>
        <h2>PRODUCCION DE EXAMENES COMPLEMENTARIOS D-8</h2>
        <div class="contendor-filtro-kpi">
            <div class="Kpi_hospital">
                <div class="kpi_general">
                    <h5>TOTAL SOLICITUDES</h5>
                    <i class="pi pi-users" style="font-size: 2rem"></i>
                    <p>{{ totalAmbos }}</p>
                </div>
                <div class="kpi_male">
                    <h5>TOTAL MASCULINO</h5>
                    <i class="pi pi-user" style="font-size: 2rem"></i>
                    <p>{{ totalMasculino }}</p>
                </div>
                <div class="kpi_female">
                    <h5>TOTAL FEMENINO</h5>
                    <i class="pi pi-user" style="font-size: 2rem"></i>
                    <p>{{ totalFemenino }}</p>
                </div>

            </div>
            <div class="filtros-container">

                <div class="filtro" v-for="(label, key) in filters" :key="key">
                    <p>{{ label }}</p>
                    <MultiSelect v-model="selectedFilters[key]" :options="filterOptions[key]" optionLabel="name"
                        display="chip" placeholder="Seleccionar" class="multiselect" :filter="true"
                        :filterPlaceholder="'Buscar'" />
                </div>
            </div>
        </div>
        <div class="graficos">
            <div class="graficos-dinamicos">
                <div class="graficos-sexo-solicitud">
                    <div class="grafica-sexo">
                        <h4>SEXO</h4>
                        <Chart type="pie" :data="chartData_sexo" :options="chartOptions_sexo"
                            style="flex:1; padding-bottom: 20px;" />
                    </div>
                    <div class="grafico-solicitud">
                        <h4>SOLICITUDES </h4>
                        <Chart type="pie" :data="chartData_soli" :options="chartOptions_soli"
                            style="flex:1; padding-bottom: 20px;" />
                    </div>
                </div>
                <div class="grafico-cantidad-solicitada">
                    <h4>CANTIDAD SOLICITADA POR SERVICIO</h4>
                    <Chart type="bar" :data="chartData_servicios" :options="chartOptions_servicios" style="flex:1; width: 90%; margin-left: 60px;
    flex-wrap: wrap; height: 320px; " />
                </div>
            </div>
            <div class="tabla-datos">
                <h4>CANTIDADES SOLICITADAS POR PRESTACIONES</h4>

                <DataTable :value="prestaciones" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]"
                    tableStyle="min-width: 50rem">
                    <Column field="id" header="ID"></Column>
                    <Column field="prestacion" header="Prestacion"></Column>
                    <Column field="cantidad" header="Cantidad Solicitada" sortable></Column>
                </DataTable>
            </div>
            <div class="grafico-bar-inver">
                <h4>DATOS GENERALES POR MESES</h4>
                <Chart type="bar" :data="chartData" :options="chartOptions" style="flex: 1; height: 500px;" />
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, computed, watchEffect } from 'vue';
import MultiSelect from 'primevue/multiselect';
import Chart from 'primevue/chart';
import FormularioD8Service from '../../service/FormularioD8Service';
import Dialog from 'primevue/dialog';

export default {
    name: 'FormularioD100',
    components: { MultiSelect, Chart, Dialog, },
    setup() {
        const loading = ref(false);

        const selectedFilters = ref({
            years: [],
            months: [],
            genders: [],
            services: [],
            doctors: [],
            requests: [],
            pacient: [],
        });

        const filterOptions = ref({
            years: [],
            months: [],
            genders: [{ name: 'MASCULINO' }, { name: 'FEMENINO' }],
            services: [],
            doctors: [],
            requests: [{ name: 'Realizado' }, { name: 'Eliminado' }],
            pacient: [],
        });
        const prestaciones = ref();
        const datos_api = ref([]);
        const datos_para_grafica = ref([]);
        const datos_estaticos = ref([]);
        const chartData = ref({ labels: [], datasets: [] });
        const chartData_sexo = ref();
        const conteoDatosSexo = ref([]);
        const chartData_soli = ref();
        const chartData_servicios = ref();

        const chartOptions = ref({
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { beginAtZero: true } },
        });
        const chartOptions_servicios = ref({
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { beginAtZero: true } },
        });
        const chartOptions_sexo = ref({

            responsive: true,
            maintainAspectRatio: false,

        });
        const chartOptions_soli = ref({

            responsive: true,
            maintainAspectRatio: false,


        });
        const datos_unicos_multi = (campos) => {
            if (!Array.isArray(datos_api.value)) {
                console.error("datos_api.value no es un arreglo válido");
                return {};
            }

            const resultado = campos.reduce((acc, campo) => {
                acc[campo] = {}; 
                datos_api.value.forEach((p) => {
                    if (p[campo] !== null && p[campo] !== undefined && p[campo] !== '') {
                        acc[campo][p[campo]] = (acc[campo][p[campo]] || 0) + 1;
                    }
                });
                return acc;
            }, {});

            return resultado;
        };

        const fetchData = async () => {
            loading.value = true;
            try {
                const response = await FormularioD8Service.filterData(
                    selectedFilters.value.months,
                    selectedFilters.value.genders,
                    selectedFilters.value.services,
                    selectedFilters.value.doctors,
                    selectedFilters.value.years,
                    selectedFilters.value.requests,
                     selectedFilters.value.pacient,
                );
                datos_api.value = response.data?.datos_filtrados || [];
                datos_para_grafica.value = response.data?.datos_unicos_id || [];
                datos_estaticos.value = response.data?.datos_grafica_estatica || [];

                const campos_filtrar = ['año', 'mes','servicio','nombre_completo_medico','tipo_paciente'];
                const resultado_unicos = datos_unicos_multi(campos_filtrar);
                const año_filtrar = Object.keys(resultado_unicos['año']);
                const mes_filtrar = Object.keys(resultado_unicos['mes']);
                const servicio_filtrar = Object.keys(resultado_unicos['servicio']);
                const doctor_filtrar = Object.keys(resultado_unicos['nombre_completo_medico']);
                const pacient_filtrar = Object.keys(resultado_unicos['tipo_paciente']);
                filterOptions.value.years = año_filtrar.map(y => ({name: y}));
                filterOptions.value.months = mes_filtrar.map(m => ({name: m}));
                filterOptions.value.services = servicio_filtrar.map (s => ({name: s}));
                filterOptions.value.doctors = doctor_filtrar.map(d => ({name: d}));
                filterOptions.value.pacient = pacient_filtrar.map(p => ({name: p}));
                processChartData();
            } catch (error) {
                console.error("Error al obtener datos filtrados:", error);
            } finally {
                loading.value = false;
            }
        };

       

        const processChartData = () => {
            if (!datos_api.value.length) return;
            if (!datos_para_grafica.value.length) return;
            const months = [...new Set(datos_estaticos.value.map(item => item.mes))];
            chartData.value.labels = months;


            const services = [...new Set(datos_estaticos.value.map(item => item.servicio))];
            const serviceCountByMonth = datos_estaticos.value.reduce((count, item) => {
                if (!count[item.mes]) count[item.mes] = {};
                count[item.mes][item.servicio] = (count[item.mes][item.servicio] || 0) + 1;
                return count;
            }, {});

            chartData.value.datasets = services.map(service => {
                const base_color = getRandomColor();
                const data = months.map(month => serviceCountByMonth[month]?.[service] || 0);
                return {
                    label: service,
                    data,
                    backgroundColor: hexToRgba(base_color, 0.4),
                    borderColor: base_color,
                    borderWidth: 1,
                };
            });

            const colorGrafico = "#f90404"
            const colorSexoMasculino = "#042df9";
            const colorSexoFemenino = "#f90404";
            const colorAprobado = "#14a006";
            const setChartData_sexo = () => {
                const conteoSexo = datos_para_grafica.value.reduce((acc,p) => {
                    if (p.sexo){
                        acc[p.sexo] = (acc[p.sexo] || 0)+1;
                    }
                    return acc
                },{});
                
                conteoDatosSexo.value = [conteoSexo['MASCULINO']||0,conteoSexo['FEMENINO']||0]
                return {
                    labels: ['MASCULINO','FEMENINO'],
                    datasets: [
                        {
                            label: 'Total',
                            data: conteoDatosSexo,
                            backgroundColor: [hexToRgba(colorSexoMasculino, 0.4),hexToRgba(colorSexoFemenino, 0.4)],
                            borderColor: [colorSexoMasculino,colorSexoFemenino],
                            borderWidth: 1
                        }
                    ]
                };
            };
            const setChartData_soli = () => {
                const conteoSolicitudes = datos_para_grafica.value.reduce((acc,p) => {
                    if (p.solicitudes){
                        acc[p.solicitudes] = (acc[p.solicitudes] || 0)+1;
                    }
                    return acc
                },{});
                
                const conteoDatos = [conteoSolicitudes['Realizado']||0,conteoSolicitudes['Eliminado']||0]
                return {
                    labels: ['REALIZADO','ELIMINADO'],
                    datasets: [
                        {
                            label: 'Total',
                            data: conteoDatos,
                            backgroundColor: [hexToRgba(colorAprobado, 0.4), hexToRgba(colorSexoFemenino,0.4)],
                            borderColor: [colorAprobado,colorSexoFemenino],
                            borderWidth: 1
                        }
                    ]
                }
            }
            const setChartData_servicios = () => {
                const conteoServicios = datos_para_grafica.value.reduce((acc, p) => {
                    if (p.servicio) {
                        acc[p.servicio] = (acc[p.servicio] || 0) + 1;
                    }
                    return acc;
                }, {});

                const servicios_para_filtrar = Object.keys(conteoServicios);
                const conteoData = Object.values(conteoServicios);

                return {
                    labels: servicios_para_filtrar,
                    datasets: [
                        {
                            label: 'Total',
                            backgroundColor: hexToRgba(colorGrafico, 0.4),
                            borderColor: colorGrafico,
                            borderWidth: 1,
                            data: conteoData,
                        },
                    ],
                };
            };
            const conteoPrestaciones = datos_api.value.reduce((acc, p) => {
                if (p.prestacion) {
                    acc[p.prestacion] = (acc[p.prestacion] || 0) + 1;
                }
                return acc;
            }, {});

            const prestaciones_para_filtrar = Object.keys(conteoPrestaciones);
            const conteoDataPrestaciones = Object.values(conteoPrestaciones);
            prestaciones.value = prestaciones_para_filtrar.map((p, index) => ({
                id: index + 1,
                prestacion: p,
                cantidad: conteoDataPrestaciones[index],
            }))
            chartData_soli.value = setChartData_soli();
            chartData_sexo.value = setChartData_sexo();
            chartData_servicios.value = setChartData_servicios();


        };

        const getRandomColor = () => {
            const letters = '0123456789ABCDEF';
            let color = '#';
            for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
            return color;
        };

        const hexToRgba = (hex, alpha) => {
            const bigint = parseInt(hex.slice(1), 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        const totalMasculino = computed(() => conteoDatosSexo.value[0]);
        const totalFemenino = computed(() => conteoDatosSexo.value[1]);
        const totalAmbos = computed(() => totalMasculino.value + totalFemenino.value);

        const filters = computed(() => ({
            years: 'Gestion',
            services: 'Servicios',
            requests: 'Solicitudes',
            months: 'Mes',
            doctors: 'Medicos',
            genders: 'Sexo',
            pacient: 'Tipo de Paciente',
        }));

        watchEffect(() => {
            fetchData();
        });

        onMounted(fetchData);

        return {
            loading,
            selectedFilters,
            filterOptions,
            chartData,
            chartOptions,
            chartData_sexo,
            chartData_soli,
            chartData_servicios,
            chartOptions_sexo,
            chartOptions_soli,
            chartOptions_servicios,
            totalMasculino,
            totalFemenino,
            totalAmbos,
            filters,
            prestaciones,
        };
    },
};
</script>

<style scoped>
.card {
    position: relative;
    overflow: hidden;
}

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: all;
}

.loading-content {
    text-align: center;
    color: #555;
}

.filtros-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    align-items: center;
    margin-left: 120px;
}

.filtro {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}


.multiselect {
    width: 200px;


}

.Kpi_hospital {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    margin-left: 50px;
    
}

.kpi_general,
.kpi_male,
.kpi_female {
    text-align: center;
    font-size: 1.5rem;
    padding: 0.3rem;
    padding-top: 50px;
    
    border-radius: 10px;
    box-shadow: 10px 10px 15px rgba(0, 0, 0, 0.5);
    width: 120px;
    color: black;
}

.kpi_general {
    background-color: #66f19b;
    border: solid #01aa47;
    
}

.kpi_male {
    background-color: #5ea7fa;
    border: solid #1254e2;
}

.kpi_female {
    background-color: #fa8888;
    border: solid #f13232;
}

.graficos {
    display: flex;
    justify-content: space-between;
    gap: 2rem;
    flex-direction: column;
    margin-top: 20px;
    width: 100%;
    text-align: center;
}

.graficos-dinamicos {
    display: flex;
    flex-direction: row;


}


.grafico-solicitud,
.grafico-cantidad-solicitada {
    width: auto;
    margin-left: 20px;

    flex: 1;

    border-radius: 20px;

    box-shadow: 10px 10px 15px rgba(0, 0, 0, 0.7);

}

.grafica-sexo {
    margin-bottom: 20px;
    margin-left: 20px;
    width: auto;
    flex: 1;
    border-radius: 20px;
    box-shadow: 10px 10px 15px rgba(0, 0, 0, 0.7);
}

.tabla-datos {
    border-radius: 30px;
    box-shadow: 10px 10px 15px rgba(0, 0, 0, 0.7);
}

.contendor-filtro-kpi {
    display: flex;
    flex-direction: row;
}

.grafico-bar-inver {
    width: 100%;
    height: 100%;
    flex: 1;
    border-radius: 10px;
    box-shadow: 10px 10px 15px rgba(0, 0, 0, 0.7);
}

h3 {
    text-align: center;
    align-items: center;
    justify-content: center;
}
</style>
