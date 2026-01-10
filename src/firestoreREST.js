/**
 * Firestore REST API Wrapper
 * Bypasses Firebase SDK to avoid CORS issues with persistent connections
 */

const PROJECT_ID = 'precisionprices';
const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/**
 * Add a document to a collection
 */
export async function addDocument(collectionName, data) {
  try {
    const response = await fetch(`${BASE_URL}/${collectionName}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: convertToFirestoreFields(data)
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      id: result.name.split('/').pop(),
      ...convertFromFirestoreFields(result.fields)
    };
  } catch (error) {
    console.error('Firestore REST addDocument error:', error);
    throw error;
  }
}

/**
 * Get a document by ID
 */
export async function getDocument(collectionName, docId) {
  try {
    const response = await fetch(`${BASE_URL}/${collectionName}/${docId}?key=${API_KEY}`);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      id: docId,
      ...convertFromFirestoreFields(result.fields)
    };
  } catch (error) {
    console.error('Firestore REST getDocument error:', error);
    throw error;
  }
}

/**
 * Update a document
 */
export async function updateDocument(collectionName, docId, data) {
  try {
    const response = await fetch(`${BASE_URL}/${collectionName}/${docId}?key=${API_KEY}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: convertToFirestoreFields(data)
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Firestore REST updateDocument error:', error);
    throw error;
  }
}

/**
 * Convert JavaScript object to Firestore field format
 */
function convertToFirestoreFields(obj) {
  const fields = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;

    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      fields[key] = Number.isInteger(value)
        ? { integerValue: value.toString() }
        : { doubleValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (value instanceof Date) {
      fields[key] = { timestampValue: value.toISOString() };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(v => convertToFirestoreFields({ v }).v)
        }
      };
    } else if (typeof value === 'object') {
      fields[key] = {
        mapValue: {
          fields: convertToFirestoreFields(value)
        }
      };
    }
  }

  return fields;
}

/**
 * Convert Firestore field format to JavaScript object
 */
function convertFromFirestoreFields(fields) {
  if (!fields) return {};

  const obj = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value.stringValue !== undefined) {
      obj[key] = value.stringValue;
    } else if (value.integerValue !== undefined) {
      obj[key] = parseInt(value.integerValue);
    } else if (value.doubleValue !== undefined) {
      obj[key] = value.doubleValue;
    } else if (value.booleanValue !== undefined) {
      obj[key] = value.booleanValue;
    } else if (value.timestampValue !== undefined) {
      obj[key] = new Date(value.timestampValue);
    } else if (value.arrayValue !== undefined) {
      obj[key] = value.arrayValue.values?.map(v =>
        convertFromFirestoreFields({ v }).v
      ) || [];
    } else if (value.mapValue !== undefined) {
      obj[key] = convertFromFirestoreFields(value.mapValue.fields);
    }
  }

  return obj;
}
