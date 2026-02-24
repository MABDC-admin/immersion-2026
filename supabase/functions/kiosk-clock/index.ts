import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { employeeId, supervisorId } = await req.json()

    if (!employeeId || !supervisorId) {
      return new Response(
        JSON.stringify({ error: 'Missing employeeId or supervisorId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Validate employee is managed by supervisor
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, manager_id')
      .eq('id', employeeId)
      .single()

    if (empError || !employee) {
      return new Response(
        JSON.stringify({ error: 'Employee not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (employee.manager_id !== supervisorId) {
      return new Response(
        JSON.stringify({ error: 'Employee is not managed by this supervisor' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    // Check if there's an existing attendance record today
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle()

    let action: 'clock_in' | 'clock_out'

    if (!existing) {
      // Clock in
      const { error: insertError } = await supabase
        .from('attendance')
        .insert({
          employee_id: employeeId,
          date: today,
          clock_in: now,
          status: 'present',
        })
      if (insertError) throw insertError
      action = 'clock_in'
    } else if (!existing.clock_out) {
      // Clock out
      const { error: updateError } = await supabase
        .from('attendance')
        .update({ clock_out: now })
        .eq('id', existing.id)
      if (updateError) throw updateError
      action = 'clock_out'
    } else {
      return new Response(
        JSON.stringify({ error: 'Already clocked in and out today' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        action,
        employeeName: `${employee.first_name} ${employee.last_name}`,
        timestamp: now,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
