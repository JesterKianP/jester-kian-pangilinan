// Demo records help portfolio reviewers understand the interface at a glance.
// Remove this script tag (or clear browser storage) to start with a blank workspace.
(() => {
  const key = 'northstar.customerRecords.v1';
  if (localStorage.getItem(key)) return;
  const now = Date.now();
  const records = [
    { id: 'demo-olivia-rhye', name: 'Olivia Rhye', email: 'olivia@untitledui.com', phone: '+1 (415) 555-0132', company: 'Untitled UI', status: 'In progress', createdAt: now - 1000 * 60 * 22 },
    { id: 'demo-phoenix-baker', name: 'Phoenix Baker', email: 'phoenix@circooles.com', phone: '+1 (212) 555-0148', company: 'Circooles', status: 'Completed', createdAt: now - 1000 * 60 * 60 * 3 },
    { id: 'demo-lana-steiner', name: 'Lana Steiner', email: 'lana@command.com', phone: '+1 (310) 555-0174', company: 'Command+', status: 'In progress', createdAt: now - 1000 * 60 * 60 * 9 },
    { id: 'demo-demi-wilkinson', name: 'Demi Wilkinson', email: 'demi@layers.com', phone: '+1 (646) 555-0117', company: 'Layers', status: 'On hold', createdAt: now - 1000 * 60 * 60 * 20 },
    { id: 'demo-candice-wu', name: 'Candice Wu', email: 'candice@catalog.com', phone: '+1 (206) 555-0193', company: 'Catalog', status: 'Completed', createdAt: now - 1000 * 60 * 60 * 36 },
    { id: 'demo-natali-craig', name: 'Natali Craig', email: 'natali@quotient.com', phone: '+1 (512) 555-0161', company: 'Quotient', status: 'In progress', createdAt: now - 1000 * 60 * 60 * 48 },
    { id: 'demo-drew-cano', name: 'Drew Cano', email: 'drew@quotient.com', phone: '+1 (503) 555-0198', company: 'Quotient', status: 'Completed', createdAt: now - 1000 * 60 * 60 * 61 },
    { id: 'demo-orlando-diggs', name: 'Orlando Diggs', email: 'orlando@circooles.com', phone: '+1 (917) 555-0108', company: 'Circooles', status: 'On hold', createdAt: now - 1000 * 60 * 60 * 75 },
    { id: 'demo-andi-lane', name: 'Andi Lane', email: 'andi@layers.com', phone: '+1 (303) 555-0184', company: 'Layers', status: 'In progress', createdAt: now - 1000 * 60 * 60 * 100 },
    { id: 'demo-kai-bennett', name: 'Kai Bennett', email: 'kai@brightpath.example', phone: '+1 (415) 555-0120', company: 'Brightpath', status: 'Completed', createdAt: now - 1000 * 60 * 60 * 112 },
    { id: 'demo-morgan-ellis', name: 'Morgan Ellis', email: 'morgan@fieldwork.example', phone: '+1 (617) 555-0141', company: 'Fieldwork Co.', status: 'On hold', createdAt: now - 1000 * 60 * 60 * 126 },
    { id: 'demo-sam-rivera', name: 'Sam Rivera', email: 'sam@evergreen.example', phone: '+1 (503) 555-0165', company: 'Evergreen Supply', status: 'In progress', createdAt: now - 1000 * 60 * 60 * 139 },
    { id: 'demo-alexis-parker', name: 'Alexis Parker', email: 'alexis@studiolumen.example', phone: '+1 (212) 555-0199', company: 'Studio Lumen', status: 'Completed', createdAt: now - 1000 * 60 * 60 * 151 },
    { id: 'demo-jamie-chen', name: 'Jamie Chen', email: 'jamie@oakandiron.example', phone: '+1 (206) 555-0128', company: 'Oak & Iron', status: 'In progress', createdAt: now - 1000 * 60 * 60 * 164 },
    { id: 'demo-robin-shah', name: 'Robin Shah', email: 'robin@northline.example', phone: '+1 (303) 555-0188', company: 'Northline Goods', status: 'On hold', createdAt: now - 1000 * 60 * 60 * 177 },
    { id: 'demo-casey-wells', name: 'Casey Wells', email: 'casey@juniperhouse.example', phone: '+1 (512) 555-0172', company: 'Juniper House', status: 'Completed', createdAt: now - 1000 * 60 * 60 * 190 }
  ];
  localStorage.setItem(key, JSON.stringify(records));
})();
