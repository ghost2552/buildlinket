import { db } from "../src/firebaseConfig";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";

const seedData = {
  users: {
    exampleUser: {
      uid: "exampleUser",
      email: "example@buildlink.com",
      role: "supplier",
      createdAt: serverTimestamp(),
      credentialStatus: "verified",
      credentialFiles: [
        {
          id: "sample-licence",
          name: "Trade_Licence.pdf",
          size: 245760,
          type: "application/pdf",
          url: "https://example.com/trade-licence.pdf",
          uploadedAt: new Date().toISOString(),
        },
      ],
    },
  },
  suppliers: {
    exampleSupplier: {
      name: "Demo Supplier Co.",
      contact: "demo@buildlink.com",
      phone: "+251900000000",
      verified: false,
      createdAt: serverTimestamp(),
      credentialStatus: "verified",
      credentialFiles: [
        {
          id: "sample-licence",
          name: "Trade_Licence.pdf",
          size: 245760,
          type: "application/pdf",
          url: "https://example.com/trade-licence.pdf",
          uploadedAt: new Date().toISOString(),
        },
      ],
    },
  },
  buyers: {
    exampleBuyer: {
      name: "Demo Buyer PLC",
      contact: "buyer@buildlink.com",
      company: "BuildLink Construction",
      createdAt: serverTimestamp(),
      credentialStatus: "verified",
      credentialFiles: [
        {
          id: "sample-tax-clearance",
          name: "Tax_Clearance.pdf",
          size: 185344,
          type: "application/pdf",
          url: "https://example.com/tax-clearance.pdf",
          uploadedAt: new Date().toISOString(),
        },
      ],
    },
  },
  materials: {
    exampleMaterial: {
      name: "Portland Cement",
      category: "Cement",
      unit: "Quintal",
      priceETB: 1690,
      supplierId: "exampleSupplier",
      createdAt: serverTimestamp(),
    },
  },
  rfqs: {
    sampleRfq: {
      title: "Expressway Segment Lot 04",
      description:
        "Requesting supply of structural steel and precast concrete elements for rapid bridge deployment.",
      buyerId: "exampleBuyer",
      buyerCompany: "BuildLink Construction",
      status: "open",
      dueDate: new Date().toISOString(),
      budget: 4500000,
      lineItems: [
        { description: "Precast girders", quantity: "24", unit: "units" },
        { description: "Reinforcement steel", quantity: "60", unit: "tons" },
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  },
  bids: {
    sampleRfq_exampleSupplier: {
      rfqId: "sampleRfq",
      supplierId: "exampleSupplier",
      supplierName: "Demo Supplier Co.",
      amount: 4395000,
      leadTime: "8 weeks",
      message: "Includes delivery to site and installation supervision team.",
      status: "submitted",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  },
  supplierCatalog: {
    sampleCatalogItem: {
      supplierId: "exampleSupplier",
      name: "Precast girder 12m",
      category: "Structural elements",
      unit: "unit",
      unitPrice: 185000,
      availability: "Ready within 4 weeks",
      certifications: ["ISO 9001", "CE"],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      archived: false,
    },
  },
  logisticsProfiles: {
    exampleSupplier: {
      supplierId: "exampleSupplier",
      fleetSize: "12 articulated trucks",
      coverageAreas: ["Addis Ababa", "Dire Dawa", "Adama"],
      transportModes: ["Road", "Heavy-lift"],
      leadTime: "3-5 days",
      contactPerson: "Abebe Logistics · +251900000001",
      updatedAt: serverTimestamp(),
    },
  },
  shipments: {
    sampleShipment: {
      shipmentId: "sampleShipment",
      rfqId: "sampleRfq",
      buyerId: "exampleBuyer",
      buyerCompany: "BuildLink Construction",
      supplierId: "exampleSupplier",
      supplierName: "Demo Supplier Co.",
      origin: "Addis Ababa",
      destination: "Dire Dawa",
      status: "in_transit",
      history: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  },
};

async function seedFirestore() {
  for (const [collectionName, docs] of Object.entries(seedData)) {
    for (const [docId, payload] of Object.entries(docs)) {
      await setDoc(doc(collection(db, collectionName), docId), payload, {
        merge: true,
      });
      console.log(`✅ Seeded ${docId} in ${collectionName}`);
    }
  }

  // Append shipment timeline entry post creation
  await setDoc(
    doc(collection(db, "shipments"), "sampleShipment"),
    {
      history: [
        {
          status: "scheduled",
          note: "Shipment created",
          timestamp: serverTimestamp(),
        },
        {
          status: "in_transit",
          note: "Loaded and departed",
          timestamp: serverTimestamp(),
        },
      ],
    },
    { merge: true }
  );

  console.log("🎉 Firestore seed completed");
}

seedFirestore().catch((error) => {
  console.error("❌ Firestore seed failed", error);
  process.exit(1);
});

