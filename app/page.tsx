import InventoryList from '@/components/InventoryList'
import SubscriptionForm from '@/components/SubscriptionForm'
import Disclaimer from '@/components/Disclaimer'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Hermes Inventory Tracker</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Current Inventory</h2>
          <InventoryList />
          <Disclaimer />
        </section>
        
        <section className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Subscribe for Updates</h2>
          <SubscriptionForm />
        </section>
      </div>
    </main>
  )
} 