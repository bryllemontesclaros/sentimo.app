import { db } from './firebase'
import {
  collection, addDoc, deleteDoc, updateDoc, setDoc,
  doc, query, orderBy, onSnapshot, getDoc
} from 'firebase/firestore'

export function userCol(uid, col) {
  return collection(db, 'users', uid, col)
}

export async function fsAdd(uid, col, data) {
  return await addDoc(userCol(uid, col), { ...data, createdAt: Date.now() })
}

export async function fsDel(uid, col, id) {
  return await deleteDoc(doc(db, 'users', uid, col, id))
}

export async function fsUpdate(uid, col, id, data) {
  return await updateDoc(doc(db, 'users', uid, col, id), data)
}

export function listenCol(uid, col, callback) {
  const q = query(userCol(uid, col), orderBy('createdAt', 'asc'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ ...d.data(), _id: d.id })))
  })
}

export async function fsSetProfile(uid, profile) {
  return await setDoc(doc(db, 'users', uid, 'profile', 'main'), profile, { merge: true })
}

export function listenProfile(uid, callback) {
  return onSnapshot(doc(db, 'users', uid, 'profile', 'main'), snap => {
    callback(snap.exists() ? snap.data() : {})
  })
}
