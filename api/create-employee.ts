import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'http';

// Helper to safely parse incoming request body
async function parseRequestBody(req: IncomingMessage): Promise<Record<string, any>> {
  if ((req as any).body && typeof (req as any).body === 'object') {
    return (req as any).body;
  }
  if (typeof (req as any).body === 'string') {
    try {
      return JSON.parse((req as any).body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

// Helper to send typed JSON response
function sendJsonResponse(res: ServerResponse, status: number, data: Record<string, any>) {
  if (typeof (res as any).status === 'function' && typeof (res as any).json === 'function') {
    return (res as any).status(status).json(data);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

/**
 * Server-side endpoint to create an employee account via Supabase Auth Admin API.
 * Uses the Supabase service-role key strictly on the server.
 * Ensures the Admin's browser session is never replaced or altered.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Only permit POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJsonResponse(res, 405, { error: 'Method not allowed. Use POST.' });
  }

  try {
    // 1. Validate Server Environment Configuration
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[CreateEmployee API] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
      return sendJsonResponse(res, 500, {
        error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required on the server.',
      });
    }

    // 2. Validate Admin Authorization (Bearer token)
    const authHeader = req.headers['authorization'] || (req.headers as any)['Authorization'];
    const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

    if (!token) {
      return sendJsonResponse(res, 401, {
        error: 'Unauthorized: Missing administrator session token.',
      });
    }

    // Initialize Supabase Admin client with service_role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify requesting user session with Supabase Auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return sendJsonResponse(res, 401, {
        error: 'Unauthorized: Invalid or expired administrator session.',
      });
    }

    // Verify Admin Role in profiles table
    const { data: adminProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('role, id, name')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (profileCheckError || !adminProfile || adminProfile.role !== 'OWNER') {
      return sendJsonResponse(res, 403, {
        error: 'Forbidden: Only administrators with the OWNER role can create employee accounts.',
      });
    }

    // 3. Parse and Validate Request Payload
    const body = await parseRequestBody(req);
    const {
      email,
      temporaryPassword,
      name,
      employee_id,
      joining_date,
      status = 'ACTIVE',
    } = body;

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return sendJsonResponse(res, 400, { error: 'Invalid or missing employee email address.' });
    }

    if (!temporaryPassword || typeof temporaryPassword !== 'string' || temporaryPassword.length < 8) {
      return sendJsonResponse(res, 400, {
        error: 'Temporary password must be at least 8 characters long.',
      });
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return sendJsonResponse(res, 400, { error: 'Employee name must be at least 2 characters long.' });
    }

    if (!employee_id || typeof employee_id !== 'string' || employee_id.trim().length < 2) {
      return sendJsonResponse(res, 400, { error: 'Employee ID must be at least 2 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanEmpId = employee_id.trim();
    const cleanName = name.trim();
    const cleanJoiningDate = joining_date || new Date().toISOString().split('T')[0];
    const cleanStatus = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    // 4. Check if Employee ID already exists in profiles
    const { data: existingEmpId } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('employee_id', cleanEmpId)
      .maybeSingle();

    if (existingEmpId) {
      return sendJsonResponse(res, 400, {
        error: `Employee ID "${cleanEmpId}" is already assigned.`,
      });
    }

    // 5. Create confirmed auth account using Supabase Auth Admin API
    // Email verification is disabled intentionally, confirmed immediately
    const { data: newAuthUser, error: createAuthError } =
      await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          employee_id: cleanEmpId,
          name: cleanName,
          role: 'EMPLOYEE',
          joining_date: cleanJoiningDate,
        },
      });

    if (createAuthError) {
      const errMsg = createAuthError.message || '';
      if (
        errMsg.toLowerCase().includes('already') ||
        errMsg.toLowerCase().includes('registered') ||
        createAuthError.status === 422
      ) {
        return sendJsonResponse(res, 400, {
          error: 'An account with this email already exists.',
        });
      }
      console.error('[CreateEmployee API] Supabase auth.admin.createUser error:', createAuthError);
      return sendJsonResponse(res, 400, {
        error: createAuthError.message || 'Failed to create employee authentication record.',
      });
    }

    if (!newAuthUser?.user) {
      return sendJsonResponse(res, 500, {
        error: 'Failed to create employee account: User record was not returned.',
      });
    }

    const newUserId = newAuthUser.user.id;

    // 6. Ensure profile row is synced
    const { error: profileUpsertError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUserId,
        employee_id: cleanEmpId,
        name: cleanName,
        role: 'EMPLOYEE',
        status: cleanStatus,
        joining_date: cleanJoiningDate,
      });

    if (profileUpsertError) {
      console.warn('[CreateEmployee API] Profile upsert note:', profileUpsertError.message);
    }

    // 7. Audit log the creation under Admin user ID
    try {
      await supabaseAdmin.from('audit_logs').insert({
        user_id: userData.user.id,
        action: 'CREATE_EMPLOYEE',
        entity_type: 'profiles',
        entity_id: newUserId,
        new_value: {
          employee_id: cleanEmpId,
          name: cleanName,
          email: cleanEmail,
          status: cleanStatus,
          joining_date: cleanJoiningDate,
        },
      });
    } catch (auditErr) {
      console.warn('[CreateEmployee API] Audit log insertion note:', auditErr);
    }

    // 8. Return success response (Admin session stays 100% untouched)
    return sendJsonResponse(res, 201, {
      success: true,
      data: {
        userId: newUserId,
        employeeId: cleanEmpId,
        email: cleanEmail,
        name: cleanName,
      },
    });
  } catch (err: any) {
    console.error('[CreateEmployee API] Unexpected error:', err);
    return sendJsonResponse(res, 500, {
      error: 'An unexpected internal error occurred while processing employee creation.',
    });
  }
}
