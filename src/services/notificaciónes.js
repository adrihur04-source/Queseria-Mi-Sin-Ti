import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export async function crearNotificacionStock(producto, stock) {
    if (stock > 3) return;

    const sinStock = stock <= 0;
    await addDoc(collection(db, "notificaciones"), {
        producto: producto.nombre,
        productoId: producto.id,
        mensaje: sinStock
            ? `❌ El producto ${producto.nombre} ya no tiene existencias.`
            : `⚠️ El producto ${producto.nombre} tiene solamente ${stock} piezas disponibles.`,
        tipo: sinStock ? "sin_stock" : "stock_bajo",
        leida: false,
        creado: serverTimestamp()
    });
}
