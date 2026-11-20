import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";

import { db } from "../firebase/config";

const ref = collection(db, "categorias");

export const obtenerCategorias = async () => {

  const snapshot = await getDocs(ref);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

};

export const agregarCategoria = async (categoria) => {

  await addDoc(ref, categoria);

};

export const editarCategoria = async (id, categoria) => {

  await updateDoc(
    doc(db, "categorias", id),
    categoria
  );

};

export const eliminarCategoria = async (id) => {

  await deleteDoc(
    doc(db, "categorias", id)
  );

};