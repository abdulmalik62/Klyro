const STORAGE_KEY = 'attendance_system_data';

export const mockStorage = {
  getData: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {
      users: [],
      students: [],
      classes: [],
      class_schedules: [],
      sessions: [],
      attendance: []
    };
  },
  
  saveData: (data: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  getCollection: (collectionName: string) => {
    return mockStorage.getData()[collectionName] || [];
  },

  addItem: (collectionName: string, item: any) => {
    const data = mockStorage.getData();
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    data[collectionName] = [...(data[collectionName] || []), newItem];
    mockStorage.saveData(data);
    return newItem;
  },

  updateItem: (collectionName: string, id: string, updates: any) => {
    const data = mockStorage.getData();
    data[collectionName] = data[collectionName].map((item: any) => 
      item.id === id ? { ...item, ...updates } : item
    );
    mockStorage.saveData(data);
  },

  deleteItem: (collectionName: string, id: string) => {
    const data = mockStorage.getData();
    data[collectionName] = data[collectionName].filter((item: any) => item.id !== id);
    mockStorage.saveData(data);
  }
};
