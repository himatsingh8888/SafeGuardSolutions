import pool from '../db/db.js';

// /api/client/:clientID 
export const getClient = async (req, res) => {
  const { clientID } = req.params;

  try {
    const result = await pool.query(
      `SELECT clientid, fname, lname, billingaddress, customertype, email, phone
       FROM client
       WHERE clientid = $1`,
      [clientID]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const c = result.rows[0];
    res.json({
      clientId: c.clientid,
      fname: c.fname,
      lname: c.lname,
      address: c.billingaddress,
      customerType: c.customertype,
      email: c.email,
      phone: c.phone,
    });
  } catch (err) {
    console.error('getClient error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/client/:clientID 
export const updateClient = async (req, res) => {
  const { clientID } = req.params;
  const { fname, lname, address, email, phone } = req.body;

  try {
    const result = await pool.query(
      `UPDATE client
       SET fname          = $1,
           lname          = $2,
           billingaddress = $3,
           email          = $4,
           phone          = $5
       WHERE clientid = $6
       RETURNING clientid, fname, lname, billingaddress, customertype, email, phone`,
      [fname, lname, address, email, phone, clientID]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const c = result.rows[0];
    res.json({
      clientId: c.clientid,
      fname: c.fname,
      lname: c.lname,
      address: c.billingaddress,
      customerType: c.customertype,
      email: c.email,
      phone: c.phone,
    });
  } catch (err) {
    console.error('updateClient error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/client/:clientID/installations 
export const getClientInstallations = async (req, res) => {
  const { clientID } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;

  if (limit !== null && (isNaN(limit) || limit <= 0)) {
    return res.status(400).json({ error: 'limit must be a positive integer' });
  }

  try {
    const clientCheck = await pool.query(
      'SELECT 1 FROM client WHERE clientid = $1',
      [clientID]
    );
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    let query = `
      SELECT i.installationid,
             i.siteid,
             l.address,
             i.scheduleddate,
             i.completeddate,
             i.status,
             i.description,
             i.price,
             i.techniciannumbs
      FROM   installation AS i
      JOIN   location AS l ON i.siteid = l.siteid
      WHERE  l.client = $1
      ORDER  BY i.scheduleddate DESC
        `;

    const params = [clientID];
    if (limit) {
      query += ' LIMIT $2';
      params.push(limit);
    }

    const result = await pool.query(query, params);

    res.json(
      result.rows.map((r) => ({
        installationId: r.installationid,
        siteId: r.siteid,
        address: r.address,
        scheduledDate: r.scheduleddate,
        completedDate: r.completeddate,
        status: r.status,
        description: r.description,
        price: r.price,
        technicianNums: r.techniciannumbs,
      }))
    );
  } catch (err) {
    console.error('getClientInstallations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/client/:clientID/installations/:installationID 
export const getInstallationDetail = async (req, res) => {
  const { clientID, installationID } = req.params;

  try {
    const instResult = await pool.query(
      `SELECT i.installationid,
              i.status,
              i.scheduleddate,
              i.completeddate,
              i.price,
              i.description,
              l.siteid,
              l.description AS site_description
       FROM   installation AS i
       JOIN   location AS l ON i.siteid = l.siteid
       WHERE  i.installationid = $1
         AND  l.client = $2`,
      [installationID, clientID]
    );

    if (instResult.rows.length === 0) {
      return res.status(404).json({ error: 'Installation not found for this client' });
    }

    const inst = instResult.rows[0];
    const sysResult = await pool.query(
      `SELECT DISTINCT ON (s.systemid)
              s.systemid,
              s.status,
              s.installdate,
              s.warrantyinfo,
              -- alarm
              a.numberofsensors,
              a.monitoringtype,
              a.controlpanelmodel,
              a.hasmobileintegration,
              -- camera
              c.numofcamera,
              c.recordingtype,
              c.resolutionstandard,
              c.storagecapacity,
              -- access control
              ac.numofdoorscontrolled,
              ac.controllertype,
              ac.hasdoorbellintegration,
              ac.credentialtype
       FROM   system AS s
       JOIN   installusage AS iu ON s.systemid = iu.systemid
       LEFT JOIN alarmsystem AS a  ON s.systemid = a.systemid
       LEFT JOIN camerasystem AS  c  ON s.systemid = c.systemid
       LEFT JOIN accesscontrolsystem AS ac ON s.systemid = ac.systemid
       WHERE  iu.installationid = $1`,
      [installationID]
    );

    const visitsResult = await pool.query(
      `SELECT visitnumber,
              visitdate,
              visittype,
              notes,
              outcomestatus
       FROM   servicevisit
       WHERE  installationid = $1
       ORDER  BY visitdate ASC`,
      [installationID]
    );

    const systems = sysResult.rows.map((s) => {
      const base = {
        systemId: s.systemid,
        status: s.status,
        installDate: s.installdate,
        warrantyInfo: s.warrantyinfo,
      };

      if (s.numberofsensors !== null) {
        return {
          ...base,
          type: 'alarm',
          numberOfSensors: s.numberofsensors,
          monitoringType: s.monitoringtype,
          controlPanelModel: s.controlpanelmodel,
          hasMobileIntegration: s.hasmobileintegration,
        };
      }

      if (s.numofcamera !== null) {
        return {
          ...base,
          type: 'camera',
          numOfCameras: s.numofcamera,
          recordingType: s.recordingtype,
          resolutionStandard: s.resolutionstandard,
          storageCapacity: s.storagecapacity,
        };
      }

      if (s.numofdoorscontrolled !== null) {
        return {
          ...base,
          type: 'accessControl',
          numOfDoorsControlled: s.numofdoorscontrolled,
          controllerType: s.controllertype,
          hasDoorBellIntegration: s.hasdoorbellintegration,
          credentialType: s.credentialtype,
        };
      }

      return { ...base, type: 'unknown' };
    });

    res.json({
      installationId: inst.installationid,
      status: inst.status,
      scheduledDate: inst.scheduleddate,
      completedDate: inst.completeddate,
      price: inst.price,
      description: inst.description,
      site: {
        siteId: inst.siteid,
        description: inst.site_description,
      },
      systems,
      serviceVisitList: visitsResult.rows.map((v) => ({
        visitNumber: v.visitnumber,
        visitDate: v.visitdate,
        visitType: v.visittype,
        notes: v.notes,
        outcome: v.outcomestatus,
      })),
    });
  } catch (err) {
    console.error('getInstallationDetail error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/client/:clientID/payments 
export const getClientPayments = async (req, res) => {
  const { clientID } = req.params;

  try {
    const clientCheck = await pool.query(
      'SELECT 1 FROM client WHERE clientid = $1',
      [clientID]
    );
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const result = await pool.query(
      `SELECT paymentid,
              status,
              duedate,
              createdate,
              totalamount,
              paymenttype
       FROM   payment
       WHERE  client = $1
       ORDER  BY createdate DESC`,
      [clientID]
    );

    res.json(
      result.rows.map((p) => ({
        paymentId: p.paymentid,
        status: p.status,
        dueDate: p.duedate,
        createDate: p.createdate,
        totalAmount: p.totalamount,
        paymentType: p.paymenttype,
      }))
    );
  } catch (err) {
    console.error('getClientPayments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

