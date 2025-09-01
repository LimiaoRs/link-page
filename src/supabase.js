import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rxucnwgurhmorqdziezb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dWNud2d1cmhtb3JxZHppZXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NjkwNjksImV4cCI6MjA2NzQ0NTA2OX0.nh_rj5HcskDHRwAGIECsEwznhzBjS7GrpN_Y-xGWcB0'

export const supabase = createClient(supabaseUrl, supabaseKey)
export const auth = supabase.auth

// 生成随机4位数字后缀
const generateDiscriminator = () => {
  return Math.floor(Math.random() * 10000).toString().padStart(4, '0')
}

// 用户认证 - 支持 discriminator，确保保存邮箱
export const signUp = async (email, password, username, displayName) => {
  console.log('开始注册用户:', { email, username, displayName });
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      data: { 
        username: username,
        display_name: displayName
      } 
    }
  })
  
  console.log('Supabase 注册结果:', { data, error });
  
  if (data.user && !error) {
    // 尝试创建用户资料，如果用户名重复则生成新的 discriminator
    let discriminator = generateDiscriminator()
    let attempts = 0
    const maxAttempts = 10
    
    while (attempts < maxAttempts) {
      console.log(`尝试创建用户资料，第 ${attempts + 1} 次尝试，discriminator: ${discriminator}`);
      
      const profileData = {
        id: data.user.id,
        username: username.toLowerCase(), // 统一转为小写
        discriminator,
        email: email.toLowerCase(), // 确保保存邮箱
        display_name: displayName || username,
        bio: '这个人很懒，什么都没写...',
        avatar_url: '',
        current_status_emoji: '💼',
        current_status_text: '工作中'
      }
      
      const { data: insertedProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single()
      
      if (!insertError) {
        console.log('用户资料创建成功:', insertedProfile);
        break // 成功创建
      }
      
      console.log('创建用户资料失败:', insertError);
      
      if (insertError.code === '23505') { // 唯一约束违反
        discriminator = generateDiscriminator()
        attempts++
        console.log(`用户名重复，生成新的 discriminator: ${discriminator}`);
      } else {
        return { data, error: insertError }
      }
    }
    
    if (attempts >= maxAttempts) {
      return { data, error: { message: '用户名太热门了，请尝试其他用户名' } }
    }
  }
  
  return { data, error }
}

export const signIn = async (email, password) => {
  return await supabase.auth.signInWithPassword({ email, password })
}

export const signOut = async () => {
  return await supabase.auth.signOut()
}

// 用户资料
export const getUserProfile = async (userId) => {
  return await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
}

// 搜索用户 - 只支持精确用户名搜索（username#discriminator）
export const searchUsers = async (query) => {
  console.log('搜索用户，查询条件:', query);
  
  if (!query || query.trim() === '') {
    return { data: [], error: null }
  }
  
  const cleanQuery = query.trim()
  
  try {
    // 只支持 username#discriminator 格式
    if (cleanQuery.includes('#')) {
      console.log('检测到 # 格式，按用户名和discriminator精确搜索');
      const [username, discriminator] = cleanQuery.split('#')
      
      if (username && discriminator && discriminator.length === 4 && /^\d{4}$/.test(discriminator)) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, discriminator, email, avatar_url, bio, display_name')
          .eq('username', username) // 严格匹配大小写
          .eq('discriminator', discriminator)
          .limit(1)
        
        console.log('精确搜索结果:', { data, error });
        return { data: data || [], error }
      } else {
        console.log('用户名格式不正确');
        return { data: [], error: { message: '请输入正确的用户名格式，例如: chenziyang#1234' } }
      }
    }
    
    // 如果不是 username#discriminator 格式，返回提示
    console.log('搜索格式不正确');
    return { 
      data: [], 
      error: { 
        message: '请输入正确格式：用户名#1234' 
      } 
    }
    
  } catch (error) {
    console.error('搜索用户时发生错误:', error);
    return { data: [], error }
  }
}

// 发送好友请求（防重复版）
export const sendFriendRequest = async (senderId, receiverId) => {
  console.log('发送好友请求:', { senderId, receiverId });
  
  // 先检查是否已经发送过请求
  const { data: existingRequest } = await supabase
    .from('friend_requests')
    .select('*')
    .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
    .single()
  
  if (existingRequest) {
    return { error: { message: '好友请求已存在，请耐心等待对方回应～' } }
  }
  
  // 检查是否已经是好友
  const { data: existingFriendship } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(user1_id.eq.${senderId},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${senderId})`)
    .single()
  
  if (existingFriendship) {
    return { error: { message: '你们已经是好友了！' } }
  }
  
  // 发送新的好友请求
  return await supabase
    .from('friend_requests')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'pending'
    })
}

// 获取收到的好友请求
export const getReceivedFriendRequests = async (userId) => {
  // 先获取好友请求
  const { data: requests, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  
  if (error || !requests || requests.length === 0) {
    return { data: [], error }
  }
  
  // 再获取发送者信息
  const senderIds = requests.map(req => req.sender_id)
  const { data: senders, error: sendersError } = await supabase
    .from('profiles')
    .select('id, username, discriminator, email, avatar_url, bio, display_name')
    .in('id', senderIds)
  
  if (sendersError) {
    return { data: [], error: sendersError }
  }
  
  // 组合数据
  const result = requests.map(request => ({
    ...request,
    sender: senders.find(sender => sender.id === request.sender_id)
  }))
  
  return { data: result, error: null }
}

// 获取发送的好友请求
export const getSentFriendRequests = async (userId) => {
  // 先获取好友请求
  const { data: requests, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('sender_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  
  if (error || !requests || requests.length === 0) {
    return { data: [], error }
  }
  
  // 再获取接收者信息
  const receiverIds = requests.map(req => req.receiver_id)
  const { data: receivers, error: receiversError } = await supabase
    .from('profiles')
    .select('id, username, discriminator, email, avatar_url, bio, display_name')
    .in('id', receiverIds)
  
  if (receiversError) {
    return { data: [], error: receiversError }
  }
  
  // 组合数据
  const result = requests.map(request => ({
    ...request,
    receiver: receivers.find(receiver => receiver.id === request.receiver_id)
  }))
  
  return { data: result, error: null }
}

// 处理好友请求 - 修复版本
// 处理好友请求 - 完整修复版本
export const handleFriendRequest = async (requestId, action) => {
  console.log('处理好友请求:', { requestId, action });
  
  try {
    if (action === 'accept') {
      // 先获取请求详情
      console.log('获取好友请求详情...');
      const { data: request, error: requestError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .single()
      
      console.log('好友请求详情:', { request, requestError });
      
      if (requestError || !request) {
        console.error('找不到好友请求:', requestError);
        return { error: requestError || { message: '找不到好友请求' } }
      }
      
      // 检查是否已经是好友了
      console.log('检查是否已经是好友...');
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user1_id.eq.${request.sender_id},user2_id.eq.${request.receiver_id}),and(user1_id.eq.${request.receiver_id},user2_id.eq.${request.sender_id})`)
        .single()
      
      if (existingFriendship) {
        console.log('已经是好友了，删除重复请求');
        await supabase
          .from('friend_requests')
          .delete()
          .eq('id', requestId)
        return { data: 'already_friends', error: null }
      }
      
      // 创建好友关系
      console.log('创建好友关系...');
      const { data: friendshipData, error: friendshipError } = await supabase
        .from('friendships')
        .insert({
          user1_id: request.sender_id,
          user2_id: request.receiver_id
        })
        .select()
      
      console.log('创建好友关系结果:', { friendshipData, friendshipError });
      
      if (friendshipError) {
        console.error('创建好友关系失败:', friendshipError);
        return { error: friendshipError }
      }
      
      // 删除好友请求
      console.log('删除好友请求...');
      const { data: deleteData, error: deleteError } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
        .select()
      
      console.log('删除好友请求结果:', { deleteData, deleteError });
      
      if (deleteError) {
        console.error('删除好友请求失败:', deleteError);
        return { error: deleteError }
      }
      
      console.log('接受好友请求成功');
      return { data: friendshipData, error: null }
      
    } else if (action === 'reject') {
      // 拒绝请求，直接删除
      console.log('拒绝好友请求，删除请求...');
      const { data, error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
        .select()
      
      console.log('拒绝好友请求结果:', { data, error });
      
      if (error) {
        console.error('拒绝好友请求失败:', error);
        return { error }
      }
      
      console.log('拒绝好友请求成功');
      return { data, error: null }
    } else {
      console.error('无效的操作:', action);
      return { error: { message: '无效的操作' } }
    }
  } catch (error) {
    console.error('处理好友请求时发生异常:', error);
    return { error: { message: '处理好友请求失败: ' + error.message } }
  }
}

// 获取好友列表 - 修复版本
export const getFriends = async (userId) => {
  console.log('获取好友列表，用户ID:', userId);
  
  try {
    // 首先获取好友关系
    const { data: friendships, error: friendshipsError } = await supabase
      .from('friendships')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    
    console.log('好友关系查询结果:', { friendships, friendshipsError });
    
    if (friendshipsError) {
      console.error('获取好友关系失败:', friendshipsError);
      return { data: [], error: friendshipsError }
    }
    
    if (!friendships || friendships.length === 0) {
      console.log('没有好友关系');
      return { data: [], error: null }
    }
    
    // 提取好友ID
    const friendIds = friendships.map(friendship => {
      return friendship.user1_id === userId ? friendship.user2_id : friendship.user1_id
    })
    
    console.log('好友ID列表:', friendIds);
    
    // 获取好友的详细信息
    const { data: friendProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, discriminator, email, avatar_url, bio, display_name')
      .in('id', friendIds)
    
    console.log('好友资料查询结果:', { friendProfiles, profilesError });
    
    if (profilesError) {
      console.error('获取好友资料失败:', profilesError);
      return { data: [], error: profilesError }
    }
    
    // 组合数据
    const friends = friendProfiles.map(profile => ({
      ...profile,
      friend_id: profile.id,
      friendship_id: friendships.find(f => 
        f.user1_id === profile.id || f.user2_id === profile.id
      )?.id
    }))
    
    console.log('最终好友列表:', friends);
    return { data: friends, error: null }
    
  } catch (error) {
    console.error('获取好友列表异常:', error);
    return { data: [], error: { message: '获取好友列表失败: ' + error.message } }
  }
}

// 检查好友状态
export const getFriendshipStatus = async (userId, otherUserId) => {
  // 检查是否是好友
  const { data: friendship } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`)
    .single()
  
  if (friendship) {
    return { status: 'friends', data: friendship }
  }
  
  // 检查是否有待处理的好友请求
  const { data: sentRequest } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('sender_id', userId)
    .eq('receiver_id', otherUserId)
    .eq('status', 'pending')
    .single()
  
  if (sentRequest) {
    return { status: 'request_sent', data: sentRequest }
  }
  
  const { data: receivedRequest } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('sender_id', otherUserId)
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .single()
  
  if (receivedRequest) {
    return { status: 'request_received', data: receivedRequest }
  }
  
  return { status: 'none', data: null }
}

// 删除好友
export const removeFriend = async (userId, friendId) => {
  return await supabase
    .from('friendships')
    .delete()
    .or(`and(user1_id.eq.${userId},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${userId})`)
}

// 数据库操作方法 - 兼容旧版本
export const database = {
  // 获取用户资料
  getProfile: async (userId) => {
    return await getUserProfile(userId)
  },

  // 创建用户资料
  createProfile: async (profile) => {
    return await supabase
      .from('profiles')
      .insert([profile])
      .select()
  },

  // 更新用户资料
  updateProfile: async (userId, updates) => {
    return await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
  },

  // 获取用户链接
  getLinks: async (userId) => {
    return await supabase
      .from('links')
      .select('*')
      .eq('user_id', userId)
      .order('order_index')
  },

  // 添加链接
  addLink: async (link) => {
    return await supabase
      .from('links')
      .insert([link])
      .select()
  },

  // 更新链接
  updateLink: async (linkId, updates) => {
    return await supabase
      .from('links')
      .update(updates)
      .eq('id', linkId)
      .select()
  },

  // 删除链接
  deleteLink: async (linkId) => {
    return await supabase
      .from('links')
      .delete()
      .eq('id', linkId)
  }
}

// 链接相关 - 保持向后兼容
export const saveLinks = async (userId, links) => {
  return await supabase
    .from('links')
    .upsert({ user_id: userId, links })
}

export const getLinks = async (userId) => {
  return await supabase
    .from('links')
    .select('*')
    .eq('user_id', userId)
    .order('order_index')
}

// 获取好友的完整资料信息
export const getFriendProfile = async (friendId) => {
  console.log('获取好友资料，好友ID:', friendId);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', friendId)
      .single();
    
    console.log('好友资料查询结果:', { data, error });
    
    if (error) {
      console.error('获取好友资料失败:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('获取好友资料异常:', error);
    return { data: null, error: { message: '获取好友资料失败: ' + error.message } };
  }
};

// 获取好友的所有链接 - 修复版本
export const getFriendLinks = async (friendId) => {
  console.log('获取好友链接，好友ID:', friendId);
  console.log('好友ID类型:', typeof friendId);
  
  if (!friendId) {
    console.error('好友ID为空');
    return { data: [], error: { message: '好友ID不能为空' } };
  }
  
  try {
    // 先直接查询，不使用order_index排序，避免可能的字段问题
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', friendId);
    
    console.log('好友链接查询结果:', { data, error });
    console.log('查询SQL equivalent: SELECT * FROM links WHERE user_id =', friendId);
    
    if (error) {
      console.error('获取好友链接失败:', error);
      return { data: [], error };
    }
    
    // 手动排序，避免数据库排序问题
    const sortedData = (data || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    
    console.log('排序后的链接数据:', sortedData);
    return { data: sortedData, error: null };
  } catch (error) {
    console.error('获取好友链接异常:', error);
    return { data: [], error: { message: '获取好友链接失败: ' + error.message } };
  }
};