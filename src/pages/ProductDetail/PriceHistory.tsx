import { useState, useEffect } from 'react'
import { TrendingUp, Calendar } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DatabaseService } from '@/lib/database'

interface PriceHistoryProps {
  productId: string
}

interface PriceHistoryData {
  date: string
  min_price: number
  avg_price: number
  max_price: number
  sample_count: number
}

type Period = '7d' | '1m' | '3m'

const periodToDays: Record<Period, number> = {
  '7d': 7,
  '1m': 30,
  '3m': 90
}

const PriceHistory = ({ productId }: PriceHistoryProps) => {
  const [historyData, setHistoryData] = useState<PriceHistoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('1m')

  useEffect(() => {
    const fetchPriceHistory = async () => {
      setLoading(true)
      try {
        const data = await DatabaseService.getPriceHistory(productId, periodToDays[period])
        setHistoryData(data)
      } catch (error) {
        console.error('Failed to fetch price history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPriceHistory()
  }, [productId, period])

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const formatTooltipLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const PeriodButton = ({ value, label }: { value: Period; label: string }) => (
    <button
      onClick={() => setPeriod(value)}
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
        period === value
          ? 'bg-primary-100 text-primary-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">価格推移</h2>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (historyData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">価格推移</h2>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <TrendingUp className="w-12 h-12 mb-3 text-gray-300" />
          <p>この期間の価格データはありません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold">価格推移</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <PeriodButton value="7d" label="1週間" />
          <PeriodButton value="1m" label="1ヶ月" />
          <PeriodButton value="3m" label="3ヶ月" />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart 
          data={historyData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxis}
            stroke="#9ca3af"
            style={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#9ca3af"
            style={{ fontSize: 12 }}
            tickFormatter={(value) => `¥${value}`}
          />
          <Tooltip 
            labelFormatter={formatTooltipLabel}
            formatter={(value: number) => [`¥${value}`, '']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '0.5rem'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '1rem' }}
            iconType="line"
          />
          
          <Line 
            type="monotone" 
            dataKey="min_price" 
            stroke="#10b981" 
            strokeWidth={2}
            name="最安値"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="avg_price" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="平均価格"
            strokeDasharray="5 5"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="max_price" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="最高値"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Statistics Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">データ数: </span>
            <span className="font-medium">
              {historyData.reduce((sum, d) => sum + d.sample_count, 0)}件
            </span>
          </div>
          <div>
            <span className="text-gray-500">期間内最安値: </span>
            <span className="font-medium text-green-600">
              ¥{Math.min(...historyData.map(d => d.min_price))}
            </span>
          </div>
          <div>
            <span className="text-gray-500">期間内最高値: </span>
            <span className="font-medium text-red-600">
              ¥{Math.max(...historyData.map(d => d.max_price))}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PriceHistory