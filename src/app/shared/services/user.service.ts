import { Injectable, inject } from '@angular/core';
import { Firestore, collectionData  } from '@angular/fire/firestore';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { User } from '../interfaces/user.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestore = inject(Firestore);

  getUserRealtime(userId: string): Observable<User | null> {
    return new Observable<User | null>((subscriber) => {
      const userDocRef = doc(this.firestore, 'users', userId);

      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            subscriber.next(docSnap.data() as User);
          } else {
            subscriber.next(null);
          }
        },
        (error) => {
          subscriber.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  async getAllUsers(): Promise<User[]> {
    const usersCollectionRef = collection(this.firestore, 'users');
    const querySnapshot = await getDocs(usersCollectionRef);
    const allUsers: User[] = [];

    querySnapshot.forEach((docSnap) => {
      const userData = { ...(docSnap.data() as User), id: docSnap.id };
      allUsers.push(userData);
    });

    return allUsers;
  }

  async getUser(userId: string | null): Promise<User> {
    if (!userId) {
      return Promise.reject(new Error('Invalid userId: null'));
    }
    const userDocRef = doc(this.firestore, 'users', userId);
    return getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists()) {
        return docSnap.data() as User;
      } else {
        throw new Error('User not found');
      }
    });
  }

  async getFilteredUsers(userIds: string[]): Promise<User[]> {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const results: User[] = [];

    for (const id of userIds) {
      const docRef = doc(this.firestore, 'users', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data() as User;
        results.push(userData);
      } else {
        console.warn(`User not found for ID: ${id}`);
      }
    }

    return results;
  }

  getEveryUsers(): Observable<User[]> {
    const usersCollection = collection(this.firestore, 'users');
    return collectionData(usersCollection, { idField: 'uId' }) as Observable<User[]>;
  }

  async editLastReactions(
    userId: string | null,
    reaction: string
  ): Promise<void> {
    if (!userId) {
      console.warn('Invalid userId: null');
      return;
    }

    const userDocRef = doc(this.firestore, 'users', userId);

    try {
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        console.warn('User not found');
        return;
      }

      const userData = docSnap.data() as User;
      const lastReactions = userData.uLastReactions || [];
      const index = lastReactions.indexOf(reaction);

      if (index === 0) {
      } else if (index > 0) {
        lastReactions.splice(index, 1);
        lastReactions.unshift(reaction);
      } else {
        lastReactions.unshift(reaction);
        if (lastReactions.length > 2) {
          lastReactions.pop();
        }
      }

      await updateDoc(userDocRef, { uLastReactions: lastReactions });
    } catch (error) {
      console.error('Fehler beim Editieren der LastReactions:', error);
    }
  }
}
