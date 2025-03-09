// app/api/assignments/route.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get('userId');
		const searchQuery = searchParams.get('searchQuery') || '';
		const currentPage = parseInt(searchParams.get('currentPage') || '1', 10);
		const itemsPerPage = parseInt(searchParams.get('itemsPerPage') || '10', 10);

		let orCondition = '';
		if (searchQuery) {
			const sq = `%${searchQuery}%`;
			// 이제 assignments 내부의 컬럼과 내부 관계에 대해 검색합니다.
			orCondition = `assignments.description.ilike.${sq},assignments.assignment_debtors.name.ilike.${sq},assignments.assignment_creditors.name.ilike.${sq}`;
		}

		let query = supabase
			.from('assignment_clients_with_debtor')
			.select(
				`
          assignments!inner(
            *,
            assignment_creditors!inner(*),
            assignment_debtors!inner(*)
          )
        `,
				{ count: 'exact' }
			)
			.eq('client_id', userId)
			.order('debtor_name', { ascending: true })
			.range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

		if (orCondition) {
			query = query.or(orCondition);
		}

		const { data, error, count } = await query;
		if (error) {
			return new Response(JSON.stringify({ error }), { status: 500 });
		}
		return new Response(JSON.stringify({ data, count }), { status: 200 });
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), { status: 500 });
	}
}

