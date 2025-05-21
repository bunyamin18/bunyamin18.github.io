rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Özel listeler için kurallar: Sadece oturum açmış kullanıcılar kendi listelerini okuyabilir ve yazabilir.
    match /artifacts/{appId}/users/{userId}/lists/{listId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Genel listeler için kurallar: Oturum açmış herkes okuyabilir, sadece listeyi oluşturan düzenleyebilir.
    match /artifacts/{appId}/public/data/lists/{listId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
