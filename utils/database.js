const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Execute a query with error handling and logging
 * @param {string} table - Table name
 * @param {object} options - Query options (select, filter, order, limit, etc.)
 * @returns {object} - Query result
 */
async function query(table, options = {}) {
    try {
        let query = supabase.from(table);

        // Handle select
        if (options.select) {
            query = query.select(options.select);
        } else {
            query = query.select('*');
        }

        // Handle filters
        if (options.filters) {
            options.filters.forEach(filter => {
                if (filter.operator) {
                    query = query.filter(filter.column, filter.operator, filter.value);
                } else {
                    query = query.eq(filter.column, filter.value);
                }
            });
        }

        // Handle ordering
        if (options.order) {
            query = query.order(options.order.column, { 
                ascending: options.order.ascending !== false 
            });
        }

        // Handle pagination
        if (options.range) {
            query = query.range(options.range.start, options.range.end);
        } else if (options.limit) {
            query = query.limit(options.limit);
        }

        // Execute query
        const { data, error, count } = await query;

        if (error) {
            console.error(`Database query error on table ${table}:`, error);
            return { data: null, error, count: null };
        }

        return { data, error: null, count };
    } catch (error) {
        console.error(`Unexpected error querying table ${table}:`, error);
        return { data: null, error, count: null };
    }
}

/**
 * Get a single record by ID
 * @param {string} table - Table name
 * @param {number|string} id - Record ID
 * @param {string} select - Columns to select (optional)
 * @returns {object} - Query result
 */
async function getById(table, id, select = '*') {
    return query(table, {
        select,
        filters: [{ column: 'id', value: id }]
    });
}

/**
 * Get records with pagination
 * @param {string} table - Table name
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Number of records per page
 * @param {object} options - Additional query options
 * @returns {object} - Query result with pagination info
 */
async function getPaginated(table, page = 1, pageSize = 10, options = {}) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const result = await query(table, {
        ...options,
        range: { start, end }
    });

    return {
        ...result,
        pagination: {
            page,
            pageSize,
            total: result.count || 0,
            totalPages: Math.ceil((result.count || 0) / pageSize)
        }
    };
}

/**
 * Search records with text search
 * @param {string} table - Table name
 * @param {string} searchTerm - Search term
 * @param {array} columns - Columns to search in
 * @param {object} options - Additional query options
 * @returns {object} - Query result
 */
async function search(table, searchTerm, columns, options = {}) {
    try {
        // Build OR condition for text search
        const searchConditions = columns.map(column => 
            `${column}.ilike.%${searchTerm}%`
        ).join(',');

        let query = supabase.from(table).select(options.select || '*', { count: 'exact' });

        // Apply search filter
        query = query.or(searchConditions);

        // Apply additional filters
        if (options.filters) {
            options.filters.forEach(filter => {
                query = query.eq(filter.column, filter.value);
            });
        }

        // Apply ordering
        if (options.order) {
            query = query.order(options.order.column, { 
                ascending: options.order.ascending !== false 
            });
        }

        // Apply pagination
        if (options.range) {
            query = query.range(options.range.start, options.range.end);
        } else if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error(`Search error on table ${table}:`, error);
            return { data: null, error, count: null };
        }

        return { data, error: null, count };
    } catch (error) {
        console.error(`Unexpected search error on table ${table}:`, error);
        return { data: null, error, count: null };
    }
}

/**
 * Insert a new record
 * @param {string} table - Table name
 * @param {object} data - Data to insert
 * @returns {object} - Insert result
 */
async function insert(table, data) {
    try {
        const { data: result, error } = await supabase
            .from(table)
            .insert(data)
            .select()
            .single();

        if (error) {
            console.error(`Insert error on table ${table}:`, error);
            return { data: null, error };
        }

        return { data: result, error: null };
    } catch (error) {
        console.error(`Unexpected insert error on table ${table}:`, error);
        return { data: null, error };
    }
}

/**
 * Update a record
 * @param {string} table - Table name
 * @param {number|string} id - Record ID
 * @param {object} data - Data to update
 * @returns {object} - Update result
 */
async function update(table, id, data) {
    try {
        const { data: result, error } = await supabase
            .from(table)
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(`Update error on table ${table}:`, error);
            return { data: null, error };
        }

        return { data: result, error: null };
    } catch (error) {
        console.error(`Unexpected update error on table ${table}:`, error);
        return { data: null, error };
    }
}

/**
 * Delete a record
 * @param {string} table - Table name
 * @param {number|string} id - Record ID
 * @returns {object} - Delete result
 */
async function remove(table, id) {
    try {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`Delete error on table ${table}:`, error);
            return { error: true };
        }

        return { error: null };
    } catch (error) {
        console.error(`Unexpected delete error on table ${table}:`, error);
        return { error: true };
    }
}

/**
 * Execute a raw SQL query (use with caution)
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {object} - Query result
 */
async function rawQuery(sql, params = []) {
    try {
        const { data, error } = await supabase.rpc('execute_sql', {
            sql_query: sql,
            params: params
        });

        if (error) {
            console.error('Raw query error:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Unexpected raw query error:', error);
        return { data: null, error };
    }
}

/**
 * Batch insert multiple records
 * @param {string} table - Table name
 * @param {array} records - Array of records to insert
 * @returns {object} - Insert result
 */
async function batchInsert(table, records) {
    try {
        const { data, error } = await supabase
            .from(table)
            .insert(records)
            .select();

        if (error) {
            console.error(`Batch insert error on table ${table}:`, error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error(`Unexpected batch insert error on table ${table}:`, error);
        return { data: null, error };
    }
}

/**
 * Get related records with join
 * @param {string} table - Main table
 * @param {string} relatedTable - Related table
 * @param {string} foreignKey - Foreign key column
 * @param {number|string} id - Main record ID
 * @returns {object} - Query result
 */
async function getRelated(table, relatedTable, foreignKey, id) {
    try {
        const { data, error } = await supabase
            .from(table)
            .select(`
                *,
                ${relatedTable} (*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error(`Get related error:`, error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Unexpected get related error:', error);
        return { data: null, error };
    }
}

module.exports = {
    query,
    getById,
    getPaginated,
    search,
    insert,
    update,
    remove,
    rawQuery,
    batchInsert,
    getRelated
};
