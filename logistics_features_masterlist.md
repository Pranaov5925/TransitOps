# TransitOps: Software-Only Features & AI Integrations

This list contains features and AI capabilities for the **TransitOps Platform** that are **purely software-based**. All hardware-dependent telematics (GPS hardware, temperature sensors, dashcams) and simulated tracking animations have been removed. These features focus entirely on compliance APIs, automated workflow logic, UI tools, and digital document AI.

---

## Part 1: Indian Regulatory & Highway Compliance (API & Data Focus)

These features utilize Indian APIs, tax systems, and compliance guidelines to handle transport logistics digitally without physical hardware.

1.  **National vs. State Permit Border Checker:**
    - _Concept:_ Commercial trucks crossing state boundaries in India must have a National Permit (NP) or an active state-crossing permit.
    - _Feature:_ If the destination is interstate (e.g., Maharashtra to Karnataka) and the vehicle is marked "State Permit Only" in the database, the system blocks the dispatch.
2.  **FASTag Wallet & Automated Toll Logging:**
    - _Concept:_ NHAI uses FASTag across all national highways.
    - _Feature:_ An integrated FASTag balance display. The system calculates estimated highway toll costs for a route and automatically deducts it from the vehicle's FASTag wallet when a trip status changes to "Completed," logging it under `expenses`.
3.  **GST E-Way Bill Tracker & Expiry Watchdog:**
    - _Concept:_ Moving commercial goods worth >₹50,000 in India legally requires a GST E-Way Bill with a strict distance-based validity (1 day per 200 km).
    - _Feature:_ Drivers enter the 12-digit E-Way Bill Number. The system calculates the trip distance and alerts the dispatcher if the estimated trip duration is close to exceeding the E-Way bill's expiry window.
4.  **Parivahan e-Challan Scraper & Compliance Lock:**
    - _Concept:_ Transport operators frequently accumulate e-challans.
    - _Feature:_ A tab showing outstanding traffic police e-challans against the vehicle's registration number (e.g., MH-12-PQ-1234). If unresolved challans exceed a certain financial threshold (e.g., ₹5,000), the app warns the dispatcher.
5.  **Vehicle Document Expiry Alerts (PUC & FC):**
    - _Concept:_ Pollution Under Control (PUC) and Fitness Certificates (FC) are mandatory for Indian commercial vehicles.
    - _Feature:_ Automatically blocks a vehicle from being set to "Available" if its PUC or FC expiration date is in the past.

---

## Part 2: Purely Software AI Features (The Wow Factor)

These features leverage generative AI (Google Gemini API) to automate data entry, search, and decision-making directly within the web application.

6.  **AI Hinglish & Vernacular Voice Assistant:**
    - _Concept:_ Many Indian truck drivers prefer local languages or voice inputs over typing.
    - _Feature:_ A microphone widget in the app. Drivers can speak commands in Hindi or Hinglish (e.g., _"Trip start kar do"_ or _"₹3000 ka diesel bharwaya"_). The AI parses the speech to automatically trigger trip status updates or fuel logs.
7.  **Automated Fuel & Toll Receipt OCR Scanner:**
    - _Concept:_ Manually typing fuel log metrics is slow and prone to errors.
    - _Feature:_ An image upload component. When a driver uploads a picture of a fuel pump receipt or toll payment slip, Gemini Vision extracts the amount, liters, date, and vendor name, instantly populating the database log.
8.  **AI Fuel Pilferage / Theft Alert Engine:**
    - _Concept:_ Fuel theft/siphoning is a massive financial drain in Indian logistics.
    - _Feature:_ Software logic that compares fuel input logs (liters added) with the vehicle's average mileage and odometer progress. If the logged fuel exceeds the actual odometer burn rate by an anomalous threshold, the AI flags a "Suspected Fuel Theft" alert.
9.  **Agentic "Self-Healing" Dispatch (Autonomous Rerouting Logic):**
    - _Concept:_ Automatically resolving transit exceptions.
    - _Feature:_ If a driver logs a breakdown or cancels a trip mid-way, the system's AI automatically scans the database for the closest available unassigned vehicle, matching driver permits, drafts a replacement trip, and notifies the manager.
10. **Natural Language "Control Tower" Copilot:**
    - _Concept:_ A conversational interface for managers.
    - _Feature:_ A chat widget on the manager's dashboard. The manager can ask: _"List all drivers with safety scores below 75"_ or _"Suggest the most cost-effective vehicle for our upcoming Pune trip."_ The AI queries the local state and returns formatted lists.

---

## Part 3: Operational Workflow Add-ons (No Hardware)

These features improve coordination and process management between drivers and dispatchers.

11. **Pre-Trip Driver Vehicle Inspection Report (DVIR) Checklist:**
    - _Concept:_ Digital safety sign-offs.
    - _Feature:_ A digital inspection form (checking brakes, lights, fluid levels) that drivers must check off before a trip is dispatched. If any check fails, the truck is automatically marked "In Shop" and blocks dispatch.
12. **Rivigo-Style "Driver Relay" Scheduling:**
    - _Concept:_ Splitting long-distance routes among multiple drivers so they can return home daily.
    - _Feature:_ Software logic that allows a single long trip (e.g., Delhi to Mumbai) to be split into sub-trips. It schedules handoffs (Driver A hands off the vehicle to Driver B at a specific depot hub).
13. **Electronic Proof of Delivery (e-POD):**
    - _Concept:_ Closing logistics loops digitally.
    - _Feature:_ The driver clicks a button to digitally sign or upload a photo of the physical stamped invoice upon delivery to mark the trip status as "Completed".
14. **Driver Expense Cash Advances:**
    - _Concept:_ Indian drivers require cash advances for food and highway expenses.
    - _Feature:_ Add an "Advance Payment" request system inside the trip dispatcher. The system deducts the advance from the projected trip profitability in analytics.
15. **Offline-First Mode (PWA):**
    - _Concept:_ Poor cell connectivity on highways.
    - _Feature:_ Allows drivers to log trip completions, fuel, and expenses offline, automatically syncing back to the store once they regain cellular coverage.
