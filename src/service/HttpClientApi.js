import axios from "axios"

export const urlBase="http://127.0.0.1:8000/api/filtrar/";
const HttpClientApi = () => {
// export default() => {
    let token=localStorage.getItem("access_token");
    //console.log(localStorage.getItem("access_token"));
    const api= axios.create({
        baseURL:urlBase,
        headers:{
            Accept:'application/json',
            Authorization: 'Bearer '+token
        }
    });
    //error
    api.interceptors.response.use(
        (response)=>{
            return response
        },
        (error)=>{
            if(error.response.status === 401){
                console.log('INTERCEPTOR 401 **********')
            }
            if(error.response.status === 403){
                console.log('INTERCEPTOR 403 **********')
            }
            return Promise.reject(error)
        }
    )
    return api;
}
export default HttpClientApi;