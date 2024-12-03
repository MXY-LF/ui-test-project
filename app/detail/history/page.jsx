'use client'

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'
import { Modal, Card, Typography, Button, SideSheet, MarkdownRender, Image, Breadcrumb, ImagePreview, Spin } from '@douyinfe/semi-ui';
import { IconPlus, IconHome, IconLoading } from '@douyinfe/semi-icons';
import { IconList } from '@douyinfe/semi-icons-lab';
/**
 * Create 组件，用于在页面上显示文本，并在组件加载时发送 GET 请求。
 * 
 * @returns JSX 元素，包含一个 h1 标题、请求结果和一个按钮。
 */
export default function Create() {
  const { Title, Text } = Typography;
  const [data, setData] = useState([]);
  const [loading, toggleLoading] = useState(true);
  const searchParams = useSearchParams();
  const [name] = useState(searchParams.get('name'))
  const router = useRouter()
  


  // 在组件挂载时发送 GET 请求
  useEffect(() => {
    async function fetchData() {
      try {
        
        const testId = searchParams.get('testId')
        const response = await fetch(`/api/detail/history`,{
          method: 'POST', // 设置请求方法为 POST
          headers: {
            'Content-Type': 'application/json', // 设置请求头
          },
          body: JSON.stringify({testId}), // 将表单数据转换为 JSON 字符串
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        
        setData(responseData.data.detail.reverse());
        toggleLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
  }, []);
  const [videoValue, setVideoValue] = useState('')
  const [modalVisible, setModalVisible] = useState(false);
  const changeModal = (video) => {
    setModalVisible(true)
    setVideoValue(video)
  }
  const goDetail = () => {
    const id = searchParams.get('id')
    router.push(`/detail?id=${searchParams.get('id')}`)
  }
  console.log(data,name);
  
  return (

    <div className='h-screen overflow-y-scroll'>
      <Modal title="录屏" fullScreen visible={modalVisible} onOk={() => setModalVisible(false)} onCancel={() => setModalVisible(false)}>
        <video controls width="1000" height="800">
          <source src={videoValue} type="video/mp4" />
        </video>
      </Modal>
      <Spin indicator={<IconLoading />} spinning={loading}>
        <Title className="text-center p-3"><IconList size='extra-large' className='mr-4'/>历史记录</Title>
        <Breadcrumb className="p-6" compact={false}>
          <Breadcrumb.Item href="/project" icon={<IconHome />}></Breadcrumb.Item>
          <Breadcrumb.Item onClick={goDetail}>项目详情</Breadcrumb.Item>
          <Breadcrumb.Item >历史记录</Breadcrumb.Item>
        </Breadcrumb>
        <div className='p-10'>
          <div className="w-full h-full  grid grid-cols-2 gap-4">
            {data.map((item, index) => (
              <Card
                bordered={true}
                headerLine={true}
                key={item.status+index}
                title={name}
                style={{ width: '100%', height: 600, backgroundColor: '#E6F0FF' }}
                headerExtraContent={
                  <>
                  <Text type="success" className='cursor-pointer' onClick={() => goHistory(item.id,item.name)}>
                    执行时间：{item.timestamp}
                  </Text>
                  
                  </>
                }
              >
                <div className='text-cyan-400 mb-4'>测试图片:</div>
                <ImagePreview className='flex  gap-1  mb-4'>
                  {item.images?.map((img, index) => (
                    <div key={img}>
                      <Image
                        width={120}
                        height={100}
                        src={img}
                      />
                    </div>
                  ))}
                </ImagePreview>
                <div className='text-red-500 mb-4'>测试变更异常图片:</div>
                <ImagePreview className='flex  gap-1  mb-4'>
                  {item.diffImgs?.map((img, index) => (
                    <div key={img} >

                      <Image
                        width={120}
                        height={100}
                        src={img}
                      />
                    </div>
                  ))}
                </ImagePreview>
                <Button onClick={() => changeModal(item.video)}>测试录屏</Button>
              </Card>
            ))}
          </div>
        </div>
      </Spin>
    </div>

  );
}
