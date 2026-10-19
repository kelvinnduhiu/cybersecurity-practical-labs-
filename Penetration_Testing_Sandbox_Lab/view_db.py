import sqlite3

def dump_database():
    conn = sqlite3.connect('ecommerce.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("\n" + "="*50)
    print("      LIVE DATABASE RECORDS (ecommerce.db)")
    print("="*50)
    
    for table_name in ['users', 'orders']:
        print(f"\n📑 TABLE: {table_name.upper()}")
        print("-" * 50)
        try:
            records = cursor.execute(f"SELECT * FROM {table_name}").fetchall()
            if records:
                # Print human-readable headers
                headers = records[0].keys()
                print(" | ".join([f"[{h}]" for h in headers]))
                print("-" * 50)
                # Print row entries
                for row in records:
                    print(" | ".join([str(row[key]) for key in headers]))
            else:
                print("   (Table is currently empty)")
        except Exception as e:
            print(f"[-] Error reading data: {e}")
    conn.close()
    print("="*50 + "\n")

if __name__ == '__main__':
    dump_database()
