//Aqui registramos a los empleados para que tengan un id unico
import { useState } from "react"

export default function Empleados() {
//Cree una variable nueva para registrar los nuevos empleados
    const [nuevoEmpleado, setNuevoEmpleado] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    password: "",
    telefono: ""
})

     return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        Gestión de Empleados
      </h1>

      <input
    type="text"
    placeholder="Nombre"
    className="w-full border rounded p-2 mt-4"
    value={nuevoEmpleado.nombre}
    onChange={(e) =>
        setNuevoEmpleado({
            ...nuevoEmpleado,
            nombre: e.target.value
        })
    }
/>
    
    </div>
  )

}
 
