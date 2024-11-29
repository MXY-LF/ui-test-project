// 指定这是一个客户端组件
'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'
import { Button, Card, Typography, Spin, Space } from '@douyinfe/semi-ui';
import { IconSemiLogo, IconPlus, IconLoading } from '@douyinfe/semi-icons';
import { IconCascader } from '@douyinfe/semi-icons-lab';
/**
 * Create 组件，用于在页面上显示文本，并在组件加载时发送 GET 请求。
 * 
 * @returns JSX 元素，包含一个 h1 标题、请求结果和一个按钮。
 */
export default function Project() {
  const { Title, Text } = Typography;
  const { Meta } = Card;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function fetchData() {
    try {
      const response = await fetch('/api/project');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      setData(responseData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  // 在组件挂载时发送 GET 请求
  useEffect(() => {
    fetchData();
    setLoading(false);
  }, []);

  const goDetail = (id) => {
    router.push(`/detail?id=${id}`);
  };

  const goToCreate = () => {

    router.push('/create');
  };

  const goEdit = (item) => {

    router.push(`/create?id=${item.id}&name=${item.name}&port=${item.port}`);
  };

  return (
    <div className='h-screen overflow-y-scroll'>
      <Spin indicator={<IconLoading />} spinning={loading}>
        <Title className="text-center p-5 "><IconCascader size='extra-large' /> H5 UI 自动化测试平台</Title>

        <div className="w-full h-screen p-6 grid grid-cols-5 gap-3 border border-gray-300 shadow-md">
          {data.map((item, index) => (
            <Card
              key={item}
              bordered={true}
              headerLine={true}
              style={{ maxWidth: 360, height: 60, backgroundColor: '#e6f7ff' }}
              bodyStyle={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}

            >
              <div className='flex flex-row gap-1 justify-center items-center'>
                <IconSemiLogo />
                <Meta title={item.name} />
              </div>
              <Text>Port：<span className='text-cyan-400'>{item.port}</span></Text>
              <Text link onClick={() => goDetail(item.id)}>测试案例详情</Text>
              <Text className='cursor-pointer' type="warning" onClick={() => goEdit(item)}>编辑</Text>
            </Card>
          ))}
          <Card
            style={{ maxWidth: 360, height: 60, backgroundColor: '#e6f7ff' }}
            bodyStyle={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}

          >
            <span className='mr-4 text-orange-600 font-bold'>新增项目</span>
            <IconPlus onClick={goToCreate} className='cursor-pointer' />
          </Card>
        </div>
      </Spin>
    </div>
  );
}