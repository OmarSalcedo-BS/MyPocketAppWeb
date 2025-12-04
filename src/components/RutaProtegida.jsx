import { Navigate } from "react-router-dom";
import { obtenerDeLocalStorage } from "../utils/local-storage";

const RutaProtegida = ({proteger}) => {
    let token = obtenerDeLocalStorage("token");
    return token ? proteger : <Navigate to = "/" /> ;
};


export default RutaProtegida;
